@echo off
echo Building AstralStream APK using Docker...
echo.

REM Pull the React Native Android build image
docker pull reactnativecommunity/react-native-android:latest

REM Run the build in Docker container
docker run --rm -v "%cd%":/app -w /app reactnativecommunity/react-native-android:latest /bin/bash -c "cd android && ./gradlew assembleRelease"

echo.
echo Build complete! Check android/app/build/outputs/apk/release/ for your APK.
pause