import 'dart:math';

// import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/material.dart';
import 'package:jimi_app/widgets/styles.dart';

import '../api/api_services_post.dart';
import '../widgets/answer_model.dart';
import '../widgets/app_bar.dart';
import '../widgets/chat_model.dart';
import '../widgets/message_model.dart';

class Chat extends StatefulWidget {

  const Chat({Key? key}) : super(key: key);

  @override
  State<Chat> createState() => _ChatState();
}

class _ChatState extends State<Chat> {
  TextEditingController textarea = TextEditingController();
  late int chatId;
  late String uniqueId = '';
  ChatModel? chatModel;

  @override
  void initState() {
    super.initState();

    List<MessageModel> messages = [];
    chatModel = ChatModel(messages: messages);
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          color: middleColor,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            const MyAppBar(),
            Expanded(
              child: _chat(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _chat() {
    return Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Container(
            decoration: BoxDecoration(
              color: Colors.white70.withOpacity(0.5),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20.0),
                topRight: Radius.circular(20.0),
              ),
            ),
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Column(
              children: [
                chatMessages(),
                sendingMessage(),
              ],
            )));
  }

  Future<void> submit(BuildContext context, String text) async {
    MessageModel message = MessageModel(content: text, sender: "User");
    setState(() {
      if (chatModel == null) {
        List<MessageModel> messages = [];
        chatModel = ChatModel(messages: messages);
      }
      chatModel!.addMessage = message;
    });

    await _getUniqueId();
    
    ApiServicePost().sendMessage(chatModel!, uniqueId).then((res) {
      if (res?.statusCode == 201 || res?.statusCode == 200) {
        AnswerModel answer = answerModelFromJson(res!.body);
        MessageModel message = MessageModel(content: answer.response, sender: "Chatbot");

        setState(() {
          if (chatModel == null) {
            List<MessageModel> messages = [];
            chatModel = ChatModel(messages: messages);
          }
          chatModel!.addMessage = message;
        });
      }
           else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('An error occurred')),
        );
      }
    }).catchError((error) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('An error occurred')),
      );
    });
  }

  Expanded chatMessages() {
    return Expanded(
      child: ListView.builder(
        padding: const EdgeInsets.all(8),
        reverse: true,
        itemCount: chatModel!.messages.length,
        itemBuilder: (context, index) {
          MessageModel message = chatModel!.messages[chatModel!.messages.length - 1 - index];
          return Column(
            crossAxisAlignment: isMessageSentByMe(message)
                ? CrossAxisAlignment.end
                : CrossAxisAlignment.start,
            children: [
              Card(
                elevation: 8,
                color: isMessageSentByMe(message)
                    ? accentLightColor
                    : Colors.grey.shade300,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.only(
                    bottomLeft: isMessageSentByMe(message)
                        ? const Radius.circular(8)
                        : Radius.zero,
                    bottomRight: isMessageSentByMe(message)
                        ? Radius.zero
                        : const Radius.circular(8),
                    topRight: const Radius.circular(8),
                    topLeft: const Radius.circular(8),
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text(message.content),
                ),
              ),
            ],
          );
        },
      ),
    );
  }


  bool isMessageSentByMe(MessageModel message) {
    return (message.sender == "User");
  }

  String convertEnum(String input) {
    return input.toUpperCase().replaceAll(' ', '_');
  }

  Widget sendingMessage() {
    return Container(
      color: Colors.grey.shade300,
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: textarea,
              decoration: const InputDecoration(
                contentPadding: EdgeInsets.all(12),
                hintText: "Write a message",
              ),
              onSubmitted: (String text) {
                if (text != "") {
                  submit(context, text);
                }
              },
            ),
          ),
          IconButton(
            icon: const Icon(Icons.send),
            color: accentColor,
            onPressed: () {
              if (textarea.text != "") {
                submit(context, textarea.text);
              }
            },
          ),
        ],
      ),
    );
  }

  _getUniqueId() async {
    if (uniqueId == "") {
      uniqueId = Random().nextInt(100000).toString();
      debugPrint(uniqueId);
      setState(() {});
    }
  }

  /*_getUniqueId() async {
    if (uniqueId == "") {
      final DeviceInfoPlugin deviceInfoPlugin = DeviceInfoPlugin();

      try {
          if (Theme.of(context).platform == TargetPlatform.android) {
            AndroidDeviceInfo androidInfo = await deviceInfoPlugin.androidInfo;
            uniqueId = androidInfo.androidId!;
          } else if (Theme.of(context).platform == TargetPlatform.iOS) {
            IosDeviceInfo iosInfo = await deviceInfoPlugin.iosInfo;
            uniqueId = iosInfo.identifierForVendor!;
          } else {
            uniqueId = Random().nextInt(100000).toString();
          }
          debugPrint(uniqueId);
          setState(() {});
      } catch (e) {
        debugPrint('Erreur lors de la récupération de l\'identifiant unique : $e');
      }
    }
  }*/
}
