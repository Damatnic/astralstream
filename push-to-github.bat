@echo off
echo Pushing AstralStream to GitHub...
echo.
echo Please make sure you've created a repository on GitHub first.
echo.
set /p GITHUB_URL="Enter your GitHub repository URL (e.g., https://github.com/yourusername/astralstream): "

git remote add origin %GITHUB_URL%
git branch -M main
git push -u origin main

echo.
echo Code pushed! GitHub Actions will now build your APK.
echo Check the Actions tab on GitHub to see the build progress.
pause