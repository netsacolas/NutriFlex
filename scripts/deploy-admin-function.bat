@echo off
echo ========================================
echo Deploy Admin Operations Edge Function
echo ========================================
echo.

echo Deploying admin-operations function...
npx supabase functions deploy admin-operations

echo.
echo ========================================
echo Deployment complete!
echo ========================================
echo.
echo To test the function:
echo npx supabase functions logs admin-operations --follow
echo.
pause
