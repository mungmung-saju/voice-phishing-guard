import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/detection_result.dart';
import '../services/claude_service.dart';
import '../services/sms_service.dart';
import '../theme/app_theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ClaudeService _claude = ClaudeService();
  final SmsService _sms = SmsService();
  final TextEditingController _inputController = TextEditingController();
  final List<DetectionResult> _detections = [];

  StreamSubscription<IncomingSms>? _smsSub;
  bool _protectionActive = false;
  bool _analyzing = false;
  String? _statusMessage;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final started = await _sms.startListening();
    if (!mounted) return;
    setState(() {
      _protectionActive = started;
      _statusMessage = started
          ? null
          : 'SMS 권한이 필요합니다. 설정에서 권한을 허용해주세요.';
    });

    _smsSub = _sms.onSuspiciousSms.listen(_onSuspiciousSms);
  }

  Future<void> _onSuspiciousSms(IncomingSms sms) async {
    await _runAnalysis(
      message: sms.body,
      sender: sms.sender,
      isManual: false,
    );
  }

  Future<void> _analyzeManual() async {
    final text = _inputController.text.trim();
    if (text.isEmpty) {
      _showSnack('분석할 문자를 입력해주세요.');
      return;
    }

    // 수동 검사도 동일 1차 필터를 적용하되, 사용자가 직접 요청하면 통과시킴
    await _runAnalysis(
      message: text,
      sender: '수동 입력',
      isManual: true,
    );
  }

  Future<void> _runAnalysis({
    required String message,
    required String sender,
    required bool isManual,
  }) async {
    if (_analyzing) return;

    setState(() {
      _analyzing = true;
      _statusMessage = 'Claude로 위험도 분석 중…';
    });

    try {
      final result = await _claude.analyzeMessage(
        message: message,
        sender: sender,
        isManual: isManual,
      );

      if (!mounted) return;
      setState(() {
        _detections.insert(0, result);
        _statusMessage = null;
        if (isManual) _inputController.clear();
      });

      if (result.riskLevel == RiskLevel.high) {
        _showSnack('높은 위험도(${result.riskScore})가 감지되었습니다.', isError: true);
      }
    } on ClaudeServiceException catch (e) {
      if (!mounted) return;
      setState(() => _statusMessage = null);
      _showSnack(e.message, isError: true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _statusMessage = null);
      _showSnack('분석 중 오류가 발생했습니다: $e', isError: true);
    } finally {
      if (mounted) setState(() => _analyzing = false);
    }
  }

  void _showSnack(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? AppColors.danger : AppColors.surfaceElevated,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  void dispose() {
    _smsSub?.cancel();
    _sms.dispose();
    _claude.dispose();
    _inputController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        body: SafeArea(
          child: Column(
            children: [
              _buildHeader(),
              _buildPrivacyBanner(),
              Expanded(child: _buildDetectionList()),
              _buildManualInput(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    final indicatorColor =
        _protectionActive ? AppColors.accentEmerald : AppColors.danger;
    final statusText =
        _protectionActive ? '실시간 보호 활성화 됨' : '보호 비활성 — 권한 필요';

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'VoiceGuard',
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 26,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Simple & Private Security',
            style: TextStyle(
              color: AppColors.textSecondary.withOpacity(0.9),
              fontSize: 13,
              fontWeight: FontWeight.w400,
            ),
          ),
          const SizedBox(height: 18),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: indicatorColor,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: indicatorColor.withOpacity(0.45),
                        blurRadius: 8,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    statusText,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                if (_analyzing)
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.accentBlue,
                    ),
                  ),
              ],
            ),
          ),
          if (_statusMessage != null) ...[
            const SizedBox(height: 8),
            Text(
              _statusMessage!,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPrivacyBanner() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.accentBlue.withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppColors.accentBlue.withOpacity(0.25),
          ),
        ),
        child: const Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.lock_outline, size: 18, color: AppColors.accentBlue),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                '개인정보는 서버에 저장되지 않고 로컬에서 안전하게 처리됩니다',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 12.5,
                  height: 1.4,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetectionList() {
    if (_detections.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.shield_outlined,
                size: 48,
                color: AppColors.textSecondary.withOpacity(0.5),
              ),
              const SizedBox(height: 16),
              const Text(
                '최근 감지된 의심 문자가 없습니다',
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'URL 또는 의심 키워드가 포함된 SMS만 분석됩니다',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppColors.textSecondary.withOpacity(0.7),
                  fontSize: 12.5,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
      itemCount: _detections.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        return _DetectionCard(result: _detections[index]);
      },
    );
  }

  Widget _buildManualInput() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            '수동 검사',
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _inputController,
            maxLines: 3,
            minLines: 2,
            style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
            decoration: const InputDecoration(
              hintText: '의심되는 문자 내용을 붙여넣으세요…',
            ),
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _analyzeManual(),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 48,
            child: ElevatedButton.icon(
              onPressed: _analyzing ? null : _analyzeManual,
              icon: _analyzing
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white70,
                      ),
                    )
                  : const Icon(Icons.search, size: 20),
              label: Text(_analyzing ? '분석 중…' : '분석하기'),
            ),
          ),
        ],
      ),
    );
  }
}

class _DetectionCard extends StatelessWidget {
  const _DetectionCard({required this.result});

  final DetectionResult result;

  Color get _badgeColor {
    switch (result.riskLevel) {
      case RiskLevel.high:
        return AppColors.danger;
      case RiskLevel.medium:
        return AppColors.warning;
      case RiskLevel.low:
        return AppColors.accentEmerald;
    }
  }

  String get _levelLabel {
    switch (result.riskLevel) {
      case RiskLevel.high:
        return '위험';
      case RiskLevel.medium:
        return '주의';
      case RiskLevel.low:
        return '낮음';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: result.riskLevel == RiskLevel.high
              ? AppColors.danger.withOpacity(0.35)
              : AppColors.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  result.sender,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              _RiskBadge(
                score: result.riskScore,
                label: _levelLabel,
                color: _badgeColor,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            result.message,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 13,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            result.reason,
            style: TextStyle(
              color: _badgeColor.withOpacity(0.95),
              fontSize: 12.5,
              fontWeight: FontWeight.w500,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            _formatTime(result.detectedAt) +
                (result.isManual ? ' · 수동' : ' · SMS'),
            style: TextStyle(
              color: AppColors.textSecondary.withOpacity(0.7),
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final local = dt.toLocal();
    final h = local.hour.toString().padLeft(2, '0');
    final m = local.minute.toString().padLeft(2, '0');
    return '${local.month}/${local.day} $h:$m';
  }
}

class _RiskBadge extends StatelessWidget {
  const _RiskBadge({
    required this.score,
    required this.label,
    required this.color,
  });

  final int score;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.45)),
      ),
      child: Text(
        '$label $score',
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
