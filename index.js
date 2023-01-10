const express = require('express')
const app = express()
const fs = require('fs')
const os = require('os')
const path = require('path')
const multer = require('multer')

const home = process.env.HOME  // The users home directory and is the default folder to land in
let pwd = home

const port = 3001

app.listen(port,()=>{
    console.log("Server listening at port "+
                    port+
                    " !\n"+
                    "To access the server visit http://localhost:"+port+" from a browser."
                )
})

// Get listing of directory
function ls(cwd){
    let file_list = []
    pwd = cwd
    if(cwd !== home) {
        const back = cwd.split('/')
        back.pop()
        const file_name = ".."
        const file_path = "/dir:"+back.join("/")
        file_list.push( {file_name,file_path} )
    }
    if(os.platform() === 'darwin') {
        let file_name = "All Drives"
        let file_path = "/dir:/Volumes"
        file_list.push( {file_name,file_path} )
        file_name = "Home"
        file_path = "/dir:"+home
        file_list.push( {file_name,file_path} )
    }
    if(os.platform() === 'linux') {
        const file_name = "All_Drives"
        const file_path = "/dir:"+home
        file_list.push( {file_name,file_path} )
    }
    fs.readdirSync(cwd).forEach(
        (item) => {
            try{
                let file_path = cwd+(cwd === '/' ? '' : '/')+item
                const file_name = file_path.split('/').pop()
                const is_file = !fs.statSync(file_path).isDirectory()
                file_path = (is_file ? "/file:" : "/dir:") + file_path
                file_list.push({file_name,file_path})
            }
            catch(err){
                console.log("Not a file or directory or access denied")
            }
        }
    )
    return file_list
}

//Serve page
app.get('/',(req,res)=>{
    const f_list = ls( home )
    
    res.send(`<html>
    <head>
        <title>Rafsan Drive</title>
        <style>
            .link {
                color: black;
                font-size: larger;
            }
        </style>
    </head>
    <body>
        <div>
            <form action="/upload" method="post" enctype="multipart/form-data">
                <input type="file" multiple name="file">
                <input type="submit" value="submit">
            </form>
        </div>
        `+(
            f_list.map((item,index)=>{
                return `<div>
                <a class="link" href="${item.file_path}">${item.file_name}</a>
                <br />
                <br />
            </div>`
            }).join('')
        )+`
    </body>
</html>`)
})

//File upload
const stor = multer.diskStorage({
    destination: function (req,file,cb) {
        cb(null,req.place)
    },
    filename: function (req,file,cb) {
        cb(null,file.originalname)
    }
})
let upload = multer({
    storage:stor
})
const prepmid = (req, res, next) => {
    req.place = pwd;
    next();
  };
app.post('/upload',prepmid,upload.array("file"),(req,res)=>{
    console.log(pwd)
    
    if(pwd === home) res.redirect('/')
    else res.redirect("/dir:"+pwd)
})

// File open action
app.get('/file:*',(req,res)=>{
    const u = decodeURIComponent(req.url)
    const file = u.split(':').pop()
    try {
        res.sendFile(file)
    }
    catch(err){
        res.send("<h2>Invalid file</h2>")
    }
})

// Folder open action
app.get('/dir:*',(req,res)=>{
    const u = decodeURIComponent(req.url)
    const folder = u.split(':').pop()
    if(folder === home) res.redirect('/')
    const f_list = ls( folder )
    
    res.send(`<html>
    <head>
        <title>Rafsan Drive</title>
        <style>
            .link {
                color: black;
                font-size: larger;
            }
        </style>
    </head>
    <body>
        <div>
            <form action="/upload" method="post" enctype="multipart/form-data">
                <input type="file" multiple name="file">
                <input type="submit" value="submit">
            </form>
        </div>
        `+(
            f_list.map((item)=>{
                return `<div>
                <a class="link" href="${item.file_path}">${item.file_name}</a>
                <br />
                <br />
            </div>`
            }).join('')
        )+`
    </body>
</html>`)
})
