import 'package:flutter/material.dart';
import 'package:jimi_app/widgets/styles.dart';

class MyAppBar extends StatelessWidget implements PreferredSizeWidget {
  const MyAppBar({Key? key}) : super(key: key);

  final double iconSize = kToolbarHeight * 0.6;
  final double iconPadding = 10.0;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.start,
      children: [
        _jimiIcon(context),
        const SizedBox(width: 20),
        const Text("I'm Jimi the Chatbot"),
        const Expanded(
          child: SizedBox.shrink(),
        ),
        _barIcon(Icons.info, 'about', context)
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(200.0);

  Widget _jimiIcon(context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click, // Change cursor to hand on hover
      child: GestureDetector(
        onTap: () => Navigator.of(context).pushNamed("/home"),
        child: SizedBox(
          width: kToolbarHeight *
              1.4, // Set width according to your image dimensions
          height: kToolbarHeight *
              1.4, // Set height according to your image dimensions
          child: Image.asset("assets/images/logo.png")
        ),
      ),
    );
  }

  Widget _barIcon(IconData icon, String path, context) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: iconPadding),
      child: IconButton(
        icon: Icon(icon),
        iconSize: iconSize,
        color: accentColor,
        onPressed: () => Navigator.of(context).pushNamed("/$path"),
      ),
    );
  }
}
