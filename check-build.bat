@echo off
echo Checking GitHub Actions build status...
echo.
echo Your repository: https://github.com/Damatnic/astralstream
echo.
gh run list --limit 1
echo.
echo To see detailed progress, visit:
echo https://github.com/Damatnic/astralstream/actions
echo.
echo Once the build succeeds, download your APK from:
echo https://github.com/Damatnic/astralstream/releases
echo.
pause