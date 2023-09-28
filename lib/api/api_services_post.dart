import 'dart:convert';
import 'dart:developer';

import 'package:flutter/cupertino.dart';
import 'package:http/http.dart';
import 'package:jimi_app/widgets/message_model.dart';

import '../widgets/chat_model.dart';
import 'constants.dart';

class ApiServicePost {
  Future<Response?> postApi(String endPointUrl, Map<String, dynamic> body) async {
    String requestBody = json.encode(body);
    debugPrint(requestBody);

    try {
      var res = await post(
        Uri.parse(ApiConstants.baseUrl + endPointUrl),
        headers: <String, String>{'Content-Type': 'application/json'},
        body: requestBody,
      );
      return res;

    } catch (e) {
      log(e.toString());
      return null;
    }
  }

  Future<Response?> sendMessage(ChatModel chatModel, String userId) async {

    List<Map<String, dynamic>> userMessages = [];
    for (MessageModel messageModel in chatModel.messages) {
      Map<String, dynamic> userMessage = {"sender": messageModel.sender, "message": messageModel.content};
      userMessages.add(userMessage);
    }

    Map<String, dynamic> chatData = {
        'userId': userId,
        'userMessages': userMessages
    };

    var res = await postApi(ApiConstants.sendMessage, chatData);
    return res;
  }
}
