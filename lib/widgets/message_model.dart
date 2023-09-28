import 'dart:convert';

MessageModel messageModelFromJson(String str) =>
    MessageModel.fromJson(json.decode(str));

class MessageModel {
  final String content;
  final String sender;

  MessageModel({
    required this.content,
    required this.sender
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) => MessageModel(
      content: json["content"],
      sender: json["sender"]
  );
}
