import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:telephony/telephony.dart';

/// 수신 SMS에 대한 1차 로컬 필터링 + 리스너 관리.
///
/// URL(http/https) 또는 의심 키워드가 포함된 경우에만 [onSuspiciousSms]를 호출합니다.
class SmsService {
  SmsService();

  final Telephony _telephony = Telephony.instance;
  final StreamController<IncomingSms> _suspiciousController =
      StreamController<IncomingSms>.broadcast();

  StreamSubscription<dynamic>? _subscription;
  bool _listening = false;

  /// 의심 문자로 판정된 SMS 스트림
  Stream<IncomingSms> get onSuspiciousSms => _suspiciousController.stream;

  bool get isListening => _listening;

  /// 1차 필터용 의심 키워드
  static const List<String> suspiciousKeywords = [
    '국민건강보험',
    '대출',
    '검찰',
    '택배배송',
    '해외결제',
  ];

  static final RegExp _urlPattern = RegExp(
    r'https?://[^\s]+',
    caseSensitive: false,
  );

  /// SMS에 URL 또는 의심 키워드가 포함되어 있는지 검사합니다.
  static bool needsApiAnalysis(String body) {
    if (body.trim().isEmpty) return false;
    if (_urlPattern.hasMatch(body)) return true;
    for (final keyword in suspiciousKeywords) {
      if (body.contains(keyword)) return true;
    }
    return false;
  }

  /// SMS 수신 권한 요청
  Future<bool> requestPermissions() async {
    final granted = await _telephony.requestPhoneAndSmsPermissions;
    return granted ?? false;
  }

  /// 백그라운드/포그라운드 SMS 수신 리스너 시작
  Future<bool> startListening() async {
    if (_listening) return true;

    final granted = await requestPermissions();
    if (!granted) {
      debugPrint('[SmsService] SMS 권한이 거부되었습니다.');
      return false;
    }

    // 앱이 포그라운드일 때
    _telephony.listenIncomingSms(
      onNewMessage: _handleIncoming,
      onBackgroundMessage: onBackgroundMessage,
      listenInBackground: true,
    );

    _listening = true;
    debugPrint('[SmsService] SMS 리스너 활성화');
    return true;
  }

  void _handleIncoming(SmsMessage message) {
    final body = message.body ?? '';
    final address = message.address ?? '알 수 없음';

    debugPrint('[SmsService] 수신: from=$address, len=${body.length}');

    if (!needsApiAnalysis(body)) {
      debugPrint('[SmsService] 1차 필터 통과 — API 호출 생략');
      return;
    }

    debugPrint('[SmsService] 의심 패턴 감지 — API 분석 준비');
    if (!_suspiciousController.isClosed) {
      _suspiciousController.add(
        IncomingSms(body: body, sender: address),
      );
    }
  }

  Future<void> stopListening() async {
    await _subscription?.cancel();
    _subscription = null;
    _listening = false;
  }

  void dispose() {
    stopListening();
    _suspiciousController.close();
  }
}

/// 백그라운드 isolate에서 호출되는 top-level 핸들러.
/// telephony 패키지 요구사항: top-level 또는 static 함수여야 합니다.
@pragma('vm:entry-point')
void onBackgroundMessage(SmsMessage message) {
  final body = message.body ?? '';
  if (SmsService.needsApiAnalysis(body)) {
    debugPrint(
      '[SmsService/BG] 의심 SMS 감지: ${message.address} / ${body.substring(0, body.length.clamp(0, 40))}',
    );
    // 백그라운드에서는 로컬 알림 등으로 확장 가능.
    // 포그라운드 스트림은 isolate 간 공유되지 않으므로,
    // 앱 재개 시 최근 문자 재스캔 또는 로컬 DB 저장을 권장합니다.
  }
}

class IncomingSms {
  const IncomingSms({required this.body, required this.sender});

  final String body;
  final String sender;
}
