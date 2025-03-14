const express = require('express')
const app = express()
const fs = require('node:fs')
function mainui(bodycontent) {
  let index = `<!doctype html>
  <html lang="zh-cn">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no">
      <meta name="renderer" content="webkit">
  
      <!-- MDUI CSS -->
      <link rel="stylesheet" href="https://unpkg.com/mdui@1.0.2/dist/css/mdui.min.css">
      <title>CrossPDF</title>
    </head>
    <body class=" mdui-appbar-with-tab-larger mdui-theme-primary-lime mdui-theme-accent-orange">
        ${bodycontent}   
      <script src="https://unpkg.com/mdui@1.0.2/dist/js/mdui.min.js"></script>
    </body>
  </html>`
  return index
}
function appbar(barcontent) {
  let index = `<div class="mdui-appbar-fixed mdui-appbar">
    <div class="mdui-toolbar mdui-color-red">
      <a href="/" class="mdui-typo-title">CrossPDF</a>
    </div>
    ${barcontent}
  </div>`
  return index
}
function getname(filename) {
  extensionLength = filename.length - filename.lastIndexOf('.');
  result = filename.substring(0, filename.length - extensionLength)
  return result
}
function mduicontainer(content) {
    let index = '<div class="mdui-container">' + content + '</div>'
    return index
}
app.get('/', function(req,res) {
  files = fs.readdirSync('library') 
  tablecontent = `<div class='mdui-container'><div class="mdui-table-fluid"><table class="mdui-table"><thead><tr><th></th><th></th></tr></thead><tbody>`
  for(i in files) {
    aname = getname(files[i])
    tablecontent = tablecontent + `<tr><td>${aname}</td><td><a class='mdui-btn mdui-color-yellow' href="/reader?name=${files[i]}" >阅读</a></td></tr>`
  }
  tablecontent = tablecontent + '</tbody></table>'
  let index = mainui(appbar('')  + mduicontainer(tablecontent))
  res.send(index)
})
app.get('/reader', function (req,res) {
    try {
      pagenum = fs.readFileSync('save/' + req.query.name + '.save', 'utf-8')
      pagenum  = Number(pagenum)
    } catch (error) {
      pagenum = 1
    }
    let main = `<div id="pdf-container" >
    <canvas id="the-canvas" ></canvas>
</div>
<div class="mdui-dialog" id="dia">
  <div class="mdui-dialog-title">跳转</div>
  <div class="mdui-dialog-content">
    <p id="pageinfo"></p>
    <div class="mdui-textfield">
    <input class="mdui-textfield-input" id="nnum" type="number" placeholder="页数"/>
</div>
  </div>
  <div class="mdui-dialog-actions">
    <button class="mdui-btn mdui-ripple" mdui-dialog-close>关闭</button>
    <button id="gotor" class="mdui-btn mdui-ripple">确认</button>
  </div>
</div>
<script src="https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.mjs" type="module"></script>
<script type="module">
  function totop() {
    document.body.scrollTop = 0
    document.documentElement.scrollTop = 0
  }
  const container = document.getElementById('pdf-container')
  const url = '/library/${req.query.name}'
  const name = '${req.query.name}'
  var pagenum = ${pagenum}
  var { pdfjsLib } = globalThis
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.mjs'
  var loadingTask = pdfjsLib.getDocument(url)
  loadingTask.promise.then(function (pdf) {
    function openpage() {
      if (pagenum < 1) {
        return
      }
      if (pagenum > pdf.numPages)  {
        return
      }
      pdf.getPage(pagenum).then(function (page) {
        var canvas = document.getElementById('the-canvas')
        var context = canvas.getContext('2d')
        var viewport = page.getViewport({ scale: 1 })
        const scale = container.clientWidth / viewport.width
        var viewport = page.getViewport({ scale: scale })
        var renderContext = {
          canvasContext: context,
          viewport: viewport
        }
        canvas.height = viewport.height
        canvas.width = viewport.width
        page.render(renderContext)
      })
  }
  function save() {
    let xhr= new XMLHttpRequest()
    xhr.open('GET', '/save?' +  'name=' + name +'&pagenum=' + pagenum, true)
    xhr.send()
  }
  openpage()
  document.getElementById("nextb").onclick = function () {
    pagenum = pagenum + 1
    openpage()
    totop()
    save()
  }
  document.getElementById("perb").onclick = function () {
    pagenum = pagenum - 1
    openpage()
    totop()
    save()
  }
  document.getElementById("gotob").onclick = function () {
    document.getElementById('pageinfo').innerHTML = '当前页数:' + pagenum  + '总页数:' + pdf.numPages
  }
  document.getElementById("gotor").onclick = function () {
    totop()
    pagenum = Number(document.getElementById('nnum').value)
    openpage()
    save()
  }
  })
  </script>`
  let bar = `<div class="mdui-clearfix mdui-color-white">
                <button onclick="totop()" id="perb" class= "mdui-float-left mdui-btn mdui-btn-raised mdui-ripple mdui-color-theme-accent ">上一页</button>
                <button mdui-dialog="{target: '#dia'}"  id="gotob" class="mdui-float-right mdui-btn mdui-btn-raised mdui-ripple mdui-color-theme-accent ">跳转</button>
                <button   onclick="totop()" id="nextb" class="mdui-float-right mdui-btn mdui-btn-raised mdui-ripple mdui-color-theme-accent">下一页</button>
            </div>`  
  res.send(mainui(appbar(bar) + mduicontainer(main)))
})
app.get('/save',function (req,res) {
  fs.writeFile('save/' + req.query.name + '.save', req.query.pagenum, (e) => {console.log(e)})
})
app.use('/library',express.static('library'))
if(process.argv[2]) {
    port = process.argv[2]
} else {
    port = 8023
}
console.log(`浏览器访问\"http://本机IP:${port}\"来使用本程序`)
app.listen(port)