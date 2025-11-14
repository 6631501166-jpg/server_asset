@echo off
echo Starting server and testing login API...
echo.

:: Start server in background
start /B node app.js

:: Wait for server to start
timeout /t 3 /nobreak >nul

echo ================================
echo Test 1: Login with USERNAME
echo ================================
node -e "const http=require('http');const d=JSON.stringify({identifier:'user',password:'user123'});const o={hostname:'localhost',port:3000,path:'/api/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':d.length}};const r=http.request(o,(res)=>{let data='';res.on('data',(c)=>data+=c);res.on('end',()=>{console.log('Status:',res.statusCode);console.log('Response:',data);console.log('');})});r.on('error',(e)=>console.error('Error:',e.message));r.write(d);r.end();"

timeout /t 1 /nobreak >nul

echo ================================
echo Test 2: Login with EMAIL
echo ================================
node -e "const http=require('http');const d=JSON.stringify({identifier:'user@gmail.com',password:'user123'});const o={hostname:'localhost',port:3000,path:'/api/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':d.length}};const r=http.request(o,(res)=>{let data='';res.on('data',(c)=>data+=c);res.on('end',()=>{console.log('Status:',res.statusCode);console.log('Response:',data);console.log('');})});r.on('error',(e)=>console.error('Error:',e.message));r.write(d);r.end();"

timeout /t 1 /nobreak >nul

echo ================================
echo Test 3: Login with USER ID
echo ================================
node -e "const http=require('http');const d=JSON.stringify({identifier:'9',password:'user123'});const o={hostname:'localhost',port:3000,path:'/api/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':d.length}};const r=http.request(o,(res)=>{let data='';res.on('data',(c)=>data+=c);res.on('end',()=>{console.log('Status:',res.statusCode);console.log('Response:',data);console.log('');})});r.on('error',(e)=>console.error('Error:',e.message));r.write(d);r.end();"

echo.
echo Tests completed!
echo.
echo Press any key to stop server...
pause >nul

:: Stop server
taskkill /F /IM node.exe >nul 2>&1
