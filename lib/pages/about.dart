import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../widgets/app_bar.dart';

class About extends StatefulWidget {
  const About({Key? key}) : super(key: key);

  @override
  State<StatefulWidget> createState() => _AboutState();
}

class _AboutState extends State<About> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body:  Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            const MyAppBar(),
            Expanded(
              child: _pageAbout(),
            ),
          ],
        ),
    );
  }

  Widget _pageAbout() {
    return SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Welcome to the Jimi App!',
              style: TextStyle(fontSize: 24.0, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20.0),
            download(),
            const SizedBox(height: 20.0),
            const Text(
              'I\'m here to help to to manage yout agenda!',
              style: TextStyle(fontSize: 16.0),
            ),
          ]
        ));
  }

  Widget download() {
    if (!kIsWeb) {
      return Center(
          child: ElevatedButton(
            onPressed: () {
              _launchAppStore('web');
            },
            child: const Text('Go to the web site'),
          ));
    } else {
      return Center(
        child: LayoutBuilder(
          builder: (BuildContext context, BoxConstraints constraints) {
            if (constraints.maxWidth < 400) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ElevatedButton(
                    onPressed: () {
                      // _launchAppStore('ios');
                    },
                    child: const Text('Not yet available on the App Store'),
                  ),
                  const SizedBox(height: 10),
                  ElevatedButton(
                    onPressed: () {
                      _launchAppStore('android');
                    },
                    child: const Text('Get it on Google Play'),
                  ),
                ],
              );
            } else {
              return Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ElevatedButton(
                    onPressed: () {
                      // _launchAppStore('ios');
                    },
                    child: const Text('Not yet available on the App Store'),
                  ),
                  const SizedBox(width: 20),
                  ElevatedButton(
                    onPressed: () {
                      _launchAppStore('android');
                    },
                    child: const Text('Get it on Google Play'),
                  ),
                ],
              );
            }
          },
        ),
      );
    }
  }

  void _launchAppStore(String platform) async {
    String url = '';

    if (platform == 'ios') {
      url = 'https://www.apple.com/app-store/';
    } else if (platform == 'android') {
      url = 'https://play.google.com/store/apps/details?id=fr.tsp.jimithechatbot';
    } else if (platform == 'web') {
      url = 'http://jimi.h.minet.net/#/home/';
    }
    Uri uri = Uri.parse(url);

    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      throw 'Could not launch $url';
    }
  }
}
