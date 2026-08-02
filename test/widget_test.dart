import 'package:flutter_test/flutter_test.dart';
import 'package:voice_phishing_guard/main.dart';

void main() {
  testWidgets('VoiceGuard app loads home', (tester) async {
    await tester.pumpWidget(const VoiceGuardApp());
    expect(find.text('VoiceGuard'), findsOneWidget);
    expect(
      find.text('개인정보는 서버에 저장되지 않고 로컬에서 안전하게 처리됩니다'),
      findsOneWidget,
    );
  });
}
