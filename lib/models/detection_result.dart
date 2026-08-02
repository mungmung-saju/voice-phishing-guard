class DetectionResult {
  final String id;
  final String message;
  final String sender;
  final int riskScore;
  final String reason;
  final DateTime detectedAt;
  final bool isManual;

  const DetectionResult({
    required this.id,
    required this.message,
    required this.sender,
    required this.riskScore,
    required this.reason,
    required this.detectedAt,
    this.isManual = false,
  });

  RiskLevel get riskLevel {
    if (riskScore >= 70) return RiskLevel.high;
    if (riskScore >= 40) return RiskLevel.medium;
    return RiskLevel.low;
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'message': message,
        'sender': sender,
        'riskScore': riskScore,
        'reason': reason,
        'detectedAt': detectedAt.toIso8601String(),
        'isManual': isManual,
      };

  factory DetectionResult.fromJson(Map<String, dynamic> json) {
    return DetectionResult(
      id: json['id'] as String,
      message: json['message'] as String,
      sender: json['sender'] as String? ?? '알 수 없음',
      riskScore: json['riskScore'] as int,
      reason: json['reason'] as String,
      detectedAt: DateTime.parse(json['detectedAt'] as String),
      isManual: json['isManual'] as bool? ?? false,
    );
  }
}

enum RiskLevel { low, medium, high }
