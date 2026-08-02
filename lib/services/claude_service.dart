import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/detection_result.dart';

/// Anthropic Claude API를 호출하여 스미싱/보이스피싱 위험도를 분석합니다.
///
/// API Key는 아래 [apiKey]에 설정하세요.
/// 형식 예: sk-ant-api03-...
/// 실제 키는 버전 관리에 올리지 마세요.
class ClaudeService {
  ClaudeService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  /// Anthropic API Key (sk-ant-api03-... 형식)
  /// TODO: 실제 키로 교체하세요. 배포 시에는 환경변수/secure storage 사용을 권장합니다.
  static const String apiKey = 'sk-ant-api03-YOUR_API_KEY_HERE';

  static const String _model = 'claude-3-5-haiku-20241022';
  static const String _endpoint = 'https://api.anthropic.com/v1/messages';
  static const String _apiVersion = '2023-06-01';

  static const String _analysisPrompt =
      '다음 문장을 분석하여 보이스피싱/스미싱 위험도를 0~100 사이 숫자로 평가하고, '
      '위험 원인을 한 문장으로 요약하여 JSON 형태로 반환해줘. '
      '반환 포맷: {"risk_score": int, "reason": "string"}';

  /// 메시지 텍스트를 분석하여 위험도 결과를 반환합니다.
  Future<DetectionResult> analyzeMessage({
    required String message,
    String sender = '수동 입력',
    bool isManual = false,
  }) async {
    if (apiKey.contains('YOUR_API_KEY_HERE')) {
      throw ClaudeServiceException(
        'Claude API Key가 설정되지 않았습니다. '
        'lib/services/claude_service.dart 의 apiKey를 설정해주세요.',
      );
    }

    final uri = Uri.parse(_endpoint);
    final body = jsonEncode({
      'model': _model,
      'max_tokens': 256,
      'messages': [
        {
          'role': 'user',
          'content': '$_analysisPrompt\n\n분석할 문장:\n$message',
        },
      ],
    });

    final response = await _client.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': _apiVersion,
      },
      body: body,
    );

    if (response.statusCode != 200) {
      throw ClaudeServiceException(
        'Claude API 호출 실패 (${response.statusCode}): ${response.body}',
      );
    }

    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    final content = decoded['content'] as List<dynamic>?;
    if (content == null || content.isEmpty) {
      throw ClaudeServiceException('Claude API 응답에 content가 없습니다.');
    }

    final text = (content.first as Map<String, dynamic>)['text'] as String?;
    if (text == null || text.trim().isEmpty) {
      throw ClaudeServiceException('Claude API 응답 텍스트가 비어 있습니다.');
    }

    final parsed = _parseAnalysisJson(text);
    final riskScore = (parsed['risk_score'] as num).clamp(0, 100).toInt();
    final reason = parsed['reason']?.toString() ?? '분석 요약을 가져오지 못했습니다.';

    return DetectionResult(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      message: message,
      sender: sender,
      riskScore: riskScore,
      reason: reason,
      detectedAt: DateTime.now(),
      isManual: isManual,
    );
  }

  Map<String, dynamic> _parseAnalysisJson(String text) {
    // 응답이 마크다운 코드블록으로 감싸진 경우 대비
    var cleaned = text.trim();
    final fence = RegExp(r'```(?:json)?\s*([\s\S]*?)\s*```');
    final match = fence.firstMatch(cleaned);
    if (match != null) {
      cleaned = match.group(1)!.trim();
    }

    // JSON 객체만 추출
    final start = cleaned.indexOf('{');
    final end = cleaned.lastIndexOf('}');
    if (start == -1 || end == -1 || end <= start) {
      throw ClaudeServiceException('JSON 형식을 파싱할 수 없습니다: $text');
    }

    final jsonSlice = cleaned.substring(start, end + 1);
    final parsed = jsonDecode(jsonSlice) as Map<String, dynamic>;

    if (!parsed.containsKey('risk_score') || !parsed.containsKey('reason')) {
      throw ClaudeServiceException('필수 필드(risk_score, reason)가 없습니다: $text');
    }

    return parsed;
  }

  void dispose() {
    _client.close();
  }
}

class ClaudeServiceException implements Exception {
  ClaudeServiceException(this.message);
  final String message;

  @override
  String toString() => 'ClaudeServiceException: $message';
}
