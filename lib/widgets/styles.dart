import 'package:flutter/material.dart';

const Color accentColor =Color(0xfff8711e);
const Color accentLightColor =Color(0xfff88f4e); //for chat

const Color paleColor = Color(0xffFFFFFF);
const Color middleColor = Color(0xffe3e2e2);
const Color textColor = Color(0xff000000);
const Color hintColor = Color(0xff737373);
const Color elevatorColor = accentColor;
const Color primaryLogin = Colors.red;

final myButtonStyle = ButtonStyle(
  padding: MaterialStateProperty.all(const EdgeInsets.all(20)),
  backgroundColor: MaterialStateProperty.resolveWith<Color>(
        (states) {
      if (states.contains(MaterialState.pressed)) {
        return paleColor;
      } else {
        return myTheme.cardColor;
      }
    },
  ),
  shape: MaterialStateProperty.all(
    RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
  ),
  elevation: MaterialStateProperty.all(4),
  shadowColor: MaterialStateProperty.all(middleColor),
);

const ColorScheme myColorScheme = ColorScheme(
  brightness: Brightness.light,
  primary: elevatorColor,
  onPrimary: Colors.black, // text color over primary color
  secondary: middleColor,
  onSecondary: Colors.black, // text color over secondary color
  background: paleColor,
  onBackground: Colors.black, // text color over background color
  surface: paleColor,
  onSurface: Colors.black,
  error: Colors.red,
  onError: Colors.white,
);

final ThemeData myTheme = ThemeData(
  primaryColor: accentColor,
  scaffoldBackgroundColor: middleColor,
  fontFamily: 'Georgia',
  textTheme: const TextTheme(
    headlineLarge: TextStyle(fontSize: 35.0),
    titleLarge: TextStyle(fontSize: 35.0),
    titleMedium: TextStyle(fontSize: 20.0),
    titleSmall: TextStyle(fontSize: 18.0),
    bodyMedium: TextStyle(fontSize: 16.0, fontFamily: 'Georgia'),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(style: myButtonStyle),
  cardColor: accentColor,
  colorScheme: myColorScheme,
);

const TextSelectionThemeData textSelectionTheme =
TextSelectionThemeData(cursorColor: primaryLogin);

final ThemeData loginTheme = myTheme.copyWith(
  colorScheme: myColorScheme.copyWith(primary: primaryLogin),
  textSelectionTheme: textSelectionTheme,
);
