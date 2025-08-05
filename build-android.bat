@echo off
echo Building AstralStream APK...
echo.

REM Navigate to android directory
cd android

REM Build the release APK
echo Starting Gradle build...
call gradlew.bat assembleRelease

REM Check if build was successful
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build successful!
    echo APK location: app\build\outputs\apk\release\app-release.apk
) else (
    echo.
    echo Build failed! Error code: %ERRORLEVEL%
)

REM Return to parent directory
cd ..