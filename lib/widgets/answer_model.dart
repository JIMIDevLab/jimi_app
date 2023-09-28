import 'dart:convert';

AnswerModel answerModelFromJson(String str) =>
    AnswerModel.fromJson(json.decode(str));

class AnswerModel {
  final String response;

  AnswerModel({
    required this.response,
  });

  factory AnswerModel.fromJson(Map<String, dynamic> json) => AnswerModel(
      response: json["message"]
  );
}
