# Jimi App

JIMI is a school project aimed at developing an application for managment of time and calendar, which includes the functionality to open chat with a chatbot that will handle the database of the calendar.

This Jimi App is a Dart-based application using Flutter, to make an application on web, Android and iOS. This README provides essential information on how to set up and use the project.

## Table of Contents

- [Installation](#installation)
- [App Structure](#app-structure)
- [Connection with the Jimi API](#connection-with-the-jimi-api)
- [Release Builds](#release-builds)
- [App Information](#app-information)
- [Authors](#authors)

## Installation

This section provides information on setting up and running the Jimi App on various platforms.

### Getting Started

Before you can run the Jimi App, ensure you have the following dependencies installed:

1. **Flutter SDK & Dart SDK**: Download and install the Flutter SDK and Dart SDK for your specific operating system.

2. **Emulator**: Set up an emulator for Android or use a web browser for web development.

### Install the project

1. Clone the repository:
   ```shell
   git clone git@github.com:JIMIDevLab/jimi_app.git
   ```

2. Navigate to the project directory:

    ```shell
    cd jimi_app
    ```
3. Get the required dependencies:

    ```shell
    flutter pub get
    ```

### Run project on Android Studio

- Install Android Studio and install the Dart & Flutter plugins.
- Configure Flutter to link with the SDK downloaded.
- For the app, run  [main.dart](lib/main.dart) in the emulator (web or mobile).

### Run project on Terminal

- For the webapp, run:
   ```bash
  flutter run -t lib/main.dart -d chrome
   ```
  
## App Structure
The Jimi App is organized into the following features:

- [api/](lib/api/constants.dart): Connection to the Spring Boot API.
- [widget/](lib/api/constants.dart): Models and widgets functionalities.
- [pages/](lib/api/constants.dart): pages of the chatbot.

## Connection with the Jimi API
To connect the Jimi App with the Jimi API:

1. Define the API URLs in [constants.dart](lib/api/constants.dart).
2. Create a model for each type of API request.
3. Add post to [api_service_post.dart](lib/api/api_services_post.dart).
4. Call the get or post in the code to interact with the API.

> The swapgger documentation of the API is at [jimi-api.h.minet.net/swagger-ui.html](http://jimi-api.h.minet.net/swagger-ui.html)

## Release Builds
This section provides information on creating release builds for the Jimi App.

### Web
For web deployment, use the following commands (Linux):

   ```bash
   flutter build web --release --target=lib/main.dart
   mv ./build/web ./webapp
   ```

The webapp is available at http://jimi.h.minet.net/#/home

### Mobile
For mobile deployment, use Android Studio to generate signed bundle like [app-release.aab](android/app/release/app-release.aab)
The deployed application is on Google Play Store at https://play.google.com/store/apps/details?id=fr.tsp.jimithechatbot

## App Information
Project git repository: [Jimi App Repository](https://github.com/JIMIDevLab/jimi_app)

## Authors
- Juliette Debono
- Iris Marjollet
- Margot Berton
- Inès Kacer
