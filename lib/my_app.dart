
import 'package:flutter/material.dart';
import 'package:jimi_app/widgets/styles.dart';

import 'pages/about.dart';
import 'pages/chat.dart';
import 'pages/error.dart';

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  String get initialRoute {
    return '/home';
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'JIMI The Chatbot',
      theme: myTheme,
      initialRoute: initialRoute, //initialRoute
      onGenerateRoute: (RouteSettings settings) {
        WidgetBuilder builder;
        switch (settings.name) {
          case '/':
            builder = (BuildContext context) => const About();
            break;
          case '/about':
            builder = (BuildContext context) => const About();
            break;
          case '/home':
            builder = (BuildContext context) => const Chat();
            break;
          case '/error':
            builder = (BuildContext context) => const ErrorPage();
            break;
          default:
            builder = (BuildContext context) => const Chat();
            break;
        }

        return NoAnimationPageRoute(builder: builder, settings: settings);
      },
    );
  }
}

class NoAnimationPageRoute<T> extends MaterialPageRoute<T> {
  NoAnimationPageRoute({
    required WidgetBuilder builder,
    RouteSettings? settings,
  }) : super(builder: builder, settings: settings);

  @override
  Widget buildTransitions(BuildContext context, Animation<double> animation,
      Animation<double> secondaryAnimation, Widget child) {
    return child; // Disable transition animation
  }

  @override
  Duration get transitionDuration => Duration.zero;
}
