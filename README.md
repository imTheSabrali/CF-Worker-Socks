# cfproxy-plus #
### A socks5 proxy server deployed on the Cloudflare Worker ###

Cloudflare Worker 代理工具

### 使用 ###
* 将worler.js里passwd的变量值修改后复制全部内容到Worker部署.
* 在程序目录下面新建一个config.txt文件, 输入类似下面的配置内容:

{"domain":"example.com","psw":"passwd value","sport":1080,"sbind":"127.0.0.1","wkip":"","byip":""}

* domain: 	worker绑定的域名 (必填)
* psw: 			与worker.js里的passwd变量相同值 (必填)
* sport: 		本地绑定的socks5端口
* sbind: 		本地绑定的地址, 一般为 127.0.0.1
* wkip: 		为本地连接到worker指定优选的IP, 不指定则不优选IP
* byip: 		指定未被worker屏蔽的Cloudflare anycast IP, 不指定则通过本地连接

运行程序后将在本地机器开启一个socks5代理端口，浏览器或应用程序设置代理到此端口即可代理上网

推荐: Windows上可使用Proxifier来为需要代理的程序强行指定代理

[兴趣群组](https://t.me/DNetLab)

# License #
(The MIT License)

Copyright (c) 2023 DNetL &lt;DNetL@pm.me&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
