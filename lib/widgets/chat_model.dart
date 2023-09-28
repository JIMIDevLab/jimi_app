import 'dart:convert';

import 'message_model.dart';


ChatModel chatModelFromJson(String str) => ChatModel.fromJson(json.decode(str));

class ChatModel {
  final List<MessageModel> messages;

  ChatModel({
    required this.messages,
  });

  set addMessage(MessageModel message) {
    messages.add(message);
  }

  factory ChatModel.fromJson(Map<String, dynamic> json) => ChatModel(
    messages: List<MessageModel>.from(
        json["messages"].map((x) => MessageModel.fromJson(x))),
  );
}