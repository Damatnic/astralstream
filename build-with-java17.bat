@echo off
echo Setting Java 17 for build...
set JAVA_HOME=C:\Program Files\Java\jdk-17
set PATH=%JAVA_HOME%\bin;%PATH%

echo Using Java version:
java -version

cd android
echo.
echo Building release APK...
call gradlew.bat assembleRelease

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build successful!
    echo APK location: android\app\build\outputs\apk\release\app-release.apk
    dir android\app\build\outputs\apk\release\*.apk
) else (
    echo.
    echo Build failed! Error code: %ERRORLEVEL%
)

cd ..
pause