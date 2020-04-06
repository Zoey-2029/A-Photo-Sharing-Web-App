import React from 'react';
import ReactDOM from 'react-dom';
import {
  HashRouter, Route, Switch, Redirect
} from 'react-router-dom';
import {
  Grid
} from '@material-ui/core';
import './styles/main.css';
import axios from 'axios';
import "./photoShare.css";

// import necessary components
import TopBar from './components/topBar/TopBar';
import UserDetail from './components/userDetail/userDetail';
import UserList from './components/userList/userList';
import UserPhotos from './components/userPhotos/userPhotos';
import LoginRegister from "./components/LoginRegister/LoginRegister";

class PhotoShare extends React.Component {
  constructor(props) {
    super(props);
    var hash = window.location.hash;
    
    var currPath = hash.slice(1);
    var path = "startPath";

    if (currPath.includes("users")){
      path =  currPath;
    }

    var defaultContent = "";
    if (currPath === "/login-register"){
      defaultContent = "Please Login";
    }
    
    this.state= {
      changeView : false, 
      detailPath : path,
      content: "",
      contentVersion: defaultContent,
      loginUserName: "",
      isLoginIn: false,
      sharingList : [],
      sharingListId : [],
      loginUserId: ""
    }
  }

  logout = () =>{
    axios.post("/admin/logout", {})
    .then((response) =>{
      console.log(response.data);
      window.location.replace("photo-share.html#/");
      this.setState({
        isLoginIn : false,
        contentVersion : "Please Login",
        loginUserName: "",
        loginUserId:"",
      })
    })
    .catch(function(err){
      alert(err.request.response);
    });
  }

  deleteCurrentUser = () =>{
    axios.post("/deleteUser", {})
    .then((response) =>{
      console.log(response.data);
      window.location.replace("photo-share.html#/");
      this.setState({
        isLoginIn : false,
        contentVersion : "Please Login",
        loginUserName: "",
        loginUserId: "",
      })
    })
    .catch((err)=>{
      console.log(err);
    })
  }

  setLoginState = () =>{
      axios.get("/sharingList")
      .then((response) =>{
        this.setState({
          isLoginIn: true,
          sharingList: response.data.options,
          sharingListId: response.data.idList,
          loginUserId : response.data.loginUserId
        })
      })
      .catch((err)=>{
        console.log(err);
      })
      this.setState({isLoginIn : true});
  }

  // componentDidMount = () => {
  //   this.setState({changeView: "true"});
  // }

  componentDidUpdate = () => {
    var currentHash = window.location.hash;
    var currentPath = currentHash.slice(1);

    if (currentPath.includes("users") || currentPath.includes("photos")){
      var userId;

      if (currentPath.includes("users")){
        userId = currentPath.slice(7);
      }else{
        userId = currentPath.slice(8);
      }

      axios.get("/user/" + userId)
      .then((response) => {
        var user = response.data;

        var loginUser_name = this.state.loginUserName;

        if (loginUser_name == ""){
          loginUser_name = user.first_name; 
        }

        var topbarContent =  user.first_name + " " +user.last_name;
        if (currentPath.includes("photos")){
          topbarContent = "Photos of " + user.first_name + " " + user.last_name;
        }

        if (currentPath.includes("users") &&  this.state.content !== topbarContent){
          this.setState({
            detailPath: currentPath,
            contentVersion : topbarContent,
            loginUserName : loginUser_name,
          })
        }else if (currentPath.includes("photos") && this.state.content != topbarContent){
          this.setState({
            contentVersion: topbarContent, 
            detailPath : "/pics/",
            loginUserName: loginUser_name,
          });
        }
        })
      .catch(function(err){
        console.log(err);
      })
      }
  }

  handler = () => {
    this.setState({changeView: true});
  }

  needToRefresh = () =>{
    return this.state.changeView;
  }

  isLoggedIn = () =>{
    return this.state.isLoginIn;
  }

  render() {
    return (
      <HashRouter>
      <div>
      <Grid container spacing={8}>
        {
          this.isLoggedIn() ?
          <Grid item xs={12}>
            <TopBar content = {this.state.contentVersion} logoutButt = {this.logout} deleteCurrentUser = {this.deleteCurrentUser}
            loginUser = {this.state.loginUserName} uploadPhotohandler = {this.setUploadState} checkLoginStatus = {this.isLoggedIn}
              sharingList = {this.state.sharingList} sharingListId= {this.state.sharingListId}/>
          </Grid>
          :
          <div></div>
        }
        {
          this.isLoggedIn() ?
          <Grid item sm={3} className = "area">
            
              <UserList handler = {this.handler} needToRefresh = {this.needToRefresh}/>
            
          </Grid>
        :
          <div></div>
        }   

        <Grid item sm={9}>
            <Switch> 

            <Route exact path = "/login-register"
                render = {props => <LoginRegister {...props} changeLoginstatus = {this.setLoginState}/>}/>
            
            <Route exact path = "/">
               <Redirect to = "/login-register" />
            </Route>

            {
              this.isLoggedIn() ?
              <Route exact path= {this.state.detailPath}
                  render={ props => <UserDetail {...props} handler = {this.handler} clickToShowPics = {this.handler}/> }/>
                :
            <Redirect path={this.state.detailPath} to="/login-register" />
            }
            {
              this.isLoggedIn() ?
              <Route exact path= "/photos/:userId"
                render ={ props => <UserPhotos {...props}  handler = {this.handler} 
                loginUserId = {this.state.loginUserId} needToRefresh = {this.needToRefresh}/> } />
              :
              <Redirect path ="/photos/:userId" to="/login-register" />
            }
            </Switch>
        </Grid>
      </Grid>
      </div>
    </HashRouter>
    );
  }
}


ReactDOM.render(
  <PhotoShare />,
  document.getElementById('photoshareapp'),
);
