# ExpensePro - iOS and Android App

## Overview

The ExpensePro App is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Geting started with Expo

To learn more about developing with Expo, look at the following resources:

-   [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
-   [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Quickstart Guide (for Mac developers)

0. Access 🔑

    - Ensure you have access to the [ExpensePro project in Expo](https://expo.dev/accounts/webstaurantstore/projects/expense-pro).
    - (Optional) Ensure you have access to the [ExpensePro project in Firebase](https://console.firebase.google.com/u/2/project/expensepro-app/overview).
    - (If deploying for iOS) Ensure you have access to the [ExpensePro app in App Store Connect](https://appstoreconnect.apple.com/apps/6743888522/distribution).

1. Setup environment dependencies 🖥️

    - Install Ruby with Homebrew: https://mac.install.guide/ruby/13
    - Install iOS Simulator: https://docs.expo.dev/workflow/ios-simulator/
    - Install Android Studio Emulator: https://docs.expo.dev/workflow/android-studio-emulator/
    - Install the Expo CLI: https://docs.expo.dev/more/expo-cli/
    - Add the `google-services.json` file to the `/src/ExpenseProMobileApp` directory. This file can be downloaded from the [Firebase on Android Project](https://console.firebase.google.com/project/expensepro-app/settings/general/android:com.webstaurantstore.expensepro), or you can request it from another project dev if you don't have access.
    - Add the `GoogleService-Info.plist` file to the `/src/ExpenseProMobileApp` directory. This file can be downloaded from the [Firebase on iOS Project](https://console.firebase.google.com/project/expensepro-app/settings/general/ios:com.webstaurantstore.expense-pro)

2. Pull current environment variables from Expo

    From the `/src/ExpenseProMobileApp` directory run the following commands to install the EAS CLI and pull the latest environment variables

    ```bash
    npm install --global eas-cli
    eas login
    eas env:pull --environment development
    ```

    Follow the steps in the console output to login to Expo via the EAS CLI. For more info see [these docs](https://docs.expo.dev/eas-update/getting-started/).

3. Install project dependencies ⚙️

    From the `/src/ExpenseProMobileApp` directory run the following command

    ```bash
    npm install
    ```

4. Start the app 🚀

    From the `/src/ExpenseProMobileApp` directory run the following command

    ```bash
     npx expo start
    ```

    In the console output, you'll find options to open the app in a

    - [development build](https://docs.expo.dev/develop/development-builds/introduction/)
    - [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
    - [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
    - [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

5. Start coding! 🧑‍💻

    You can start developing by editing the files inside the **app** directory.
