let client_id;
const scope = 'public_repo';
let client_secret;
let user_name;
let repo_name;
var axios = require('axios');

export default class gblog {

    constructor(options={}){
        client_id = options.client_id;
        client_secret = options.client_secret;
        user_name = options.user_name;
        repo_name = options.repo_name;
    }

    storeTokenIntoLocalstorage(token) {
        localStorage.setItem('github_access_token',token)
    }

    removeTokenInLocalstorage() {
        return localStorage.removeItem('github_access_token');

    }

    checkAcessTokenInLocalstorage() {
        try{
            if(localStorage.getItem('github_access_token')){
                return localStorage.getItem('github_access_token');
            }else{
                return false;
            }
        }catch (err){
            return false;
        }
    }

    checkAcessTokenInLocalstorage() {
        try{
            if(localStorage.getItem('github_access_token')){
                return localStorage.getItem('github_access_token');
            }else{
                return false;
            }
        }catch (err){
            return false;
        }
    }

    requestIdentity() {
        return axios.get(`https://github.com/login/oauth/authorize?scope=${scope}&client_id=${client_id}`)
    }

    requestAccessToken(code) {
        return axios({
            url: 'https://github.com/login/oauth/access_token',
            method: 'post',
            data: {
                code: code,
                client_id: client_id,
                client_secret: client_secret
            },
            transformRequest: [function (data) {
                // Do whatever you want to transform the data
                let ret = ''
                for (let it in data) {
                    ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
                }
                return ret
            }],
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    }


    createComment(access_token, comment,table) {
        console.log('access_token is ',access_token)
        const headers = {
            headers:{
                'Authorization': `token ${access_token}`
            }
        };
        const data = JSON.stringify({
            "title": comment.title,
            "body": comment.content,
            "labels": [
                "bug"
            ]
        });

        axios.post(`https://api.github.com/repos/${user_name}/${repo_name}/issues`,data,headers).then(res=>{
            console.log(res)
            this.updateCommentList(table);
        },err=>{
            console.log('token error here');
            this.removeTokenInLocalstorage();
            this.render();
        })
    }


    updateCommentList(table){
        table.innerHTML ='<tr><th>Title</th><th>Content</th></tr>';
        this.getComments().then(listOfElemnts=>{
            listOfElemnts.map(each=>{
                table.appendChild(each);
            })
        })
    }

    getComments(){
        let listOfElements = [];
        return new Promise(resolve=>{
            axios.get(`https://api.github.com/repos/${user_name}/${repo_name}/issues`).then(commentsRes=>{
                console.log(commentsRes['data'])
                commentsRes['data'].map(eachComment=>{
                    let tempTr = window.document.createElement('tr');
                    tempTr.innerHTML = `<td>${eachComment['title']}<td/><td>${eachComment['body']}<td/>`
                    listOfElements.push(tempTr);
                })
                resolve(listOfElements);
            })
        })
    }

    render(){
        let access_token;
        this.Initialize().then(InitRes=>{
            access_token = InitRes.access_token;
            window.document.getElementById('root').innerHTML=''
            let title = window.document.createElement('input')
            let content = window.document.createElement('input')
            let btn = window.document.createElement('button');
            let table = window.document.createElement("table");                 // Create a ol
            btn.innerHTML = 'Click';
            this.updateCommentList(table);
            window.document.getElementById('root').appendChild(table)
            window.document.getElementById('root').appendChild(title)
            window.document.getElementById('root').appendChild(content)
            window.document.getElementById('root').appendChild(btn)
            btn.addEventListener('click',()=>{
                let post = {
                    title: title.value,
                    content: content.value
                }
                title.value = '';
                content.value = '';
                console.log('value',title.value)
                this.createComment(access_token,post,table);
            },false)
        });


    }

    //to get a valid access_token
    Initialize() {
        return new Promise((resolve)=>{
            let code;
            let access_token = this.checkAcessTokenInLocalstorage();
            if(access_token){
                resolve({access_token: access_token});

            }else{
                console.log('Initialize() is running')
                if(!window.location.search.includes('code')){
                    this.requestIdentity().then(res=>{
                        console.log('redirected url',res.request.responseURL)
                        window.location.href = res.request.responseURL;
                    }).catch(err=>{
                        console.log('getting code error',err)
                    })
                }else{
                    code = window.location.search.replace('?code=','');
                    console.log('code',code)
                    this.requestAccessToken(code).then(tokenRes=>{
                        console.log('tokenRes',tokenRes);
                        console.log('token',tokenRes.data.split(/=|&/)[1]);
                        access_token = tokenRes.data.split(/=|&/)[1];
                        this.storeTokenIntoLocalstorage(access_token);
                        console.log('new token',access_token)
                        resolve({access_token: access_token});
                    })

                }

            }
        })


    }
}

