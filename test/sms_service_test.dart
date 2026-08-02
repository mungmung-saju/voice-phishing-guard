import 'package:flutter_test/flutter_test.dart';
import 'package:voice_phishing_guard/services/sms_service.dart';

void main() {
  group('SmsService.needsApiAnalysis', () {
    test('URL이 있으면 true', () {
      expect(
        SmsService.needsApiAnalysis('클릭하세요 https://evil.example.com'),
        isTrue,
      );
      expect(
        SmsService.needsApiAnalysis('확인 http://phish.test/a'),
        isTrue,
      );
    });

    test('의심 키워드가 있으면 true', () {
      for (final keyword in SmsService.suspiciousKeywords) {
        expect(
          SmsService.needsApiAnalysis('긴급 안내: $keyword 관련 확인 요망'),
          isTrue,
          reason: keyword,
        );
      }
    });

    test('일반 문자는 false', () {
      expect(SmsService.needsApiAnalysis('오늘 저녁 뭐 먹을래?'), isFalse);
      expect(SmsService.needsApiAnalysis(''), isFalse);
    });
  });
}
