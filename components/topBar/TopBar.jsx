import React from 'react';
import {
  AppBar, Toolbar, Typography
} from '@material-ui/core';
import Select from 'react-select';
import './TopBar.css';
import axios from 'axios';
import MenuIcon from '@material-ui/icons/Menu';

/**
 * Define TopBar, a React componment of CS142 project #5
 */
class TopBar extends React.Component {

  constructor(props) {
    super(props);
    this.state= {
      file:undefined,
      selectedOptions : [],
    };
  }

  deleteUser = (event) =>{
    event.preventDefault();
    var check = confirm("Delete this user?");
    if (check){
      this.props.deleteCurrentUser();  
    }
  }


  uploadPhoto = (event) =>{
    event.preventDefault();
    
    if (this.state.file == undefined){
      alert("No photo selected");
      return;
    }

    const domForm = new FormData();
    domForm.append('uploadedphoto', this.state.file);

    let sharingList;
    var everybody = document.getElementById("public");
    var nobody = document.getElementById("private");
    var friends = document.getElementById("friends");

    if  (everybody.checked){
      sharingList = null;
    }else if (nobody.checked){
      sharingList = [];
    }else if(friends.checked){
      sharingList = this.state.selectedOptions;
    }

    axios.post('/photos/new', domForm)
    .then((response) => {
      console.log(response.data);
    })
    .catch(function(err){
      alert(err.request.response);
    })
    .then(() =>{

      axios.post("/updatePhotoVisibility", {
        sharing_list : sharingList,
        id_list: this.props.sharingListId
      })
      .then((response) =>{
        this.closeUploadDialog();
        alert(response.data);

      })
      .catch((err) =>{
        console.log(err);
      });

    });
  };

  handleChange = (selectedOptions) =>{
    if (selectedOptions == null){
      selectedOptions = [];
    }
    this.setState({selectedOptions : selectedOptions});
    
    
  };

  openUploadDialog = () =>{
    var dialog = document.getElementById("uploadDialog");
    dialog.show();
    this.hideSharingList();
    document.getElementById("public").checked = "true";
  }

  closeUploadDialog = () =>{
    var dialog = document.getElementById("uploadDialog");
    dialog.close();
    this.hideSharingList();
    this.setState({
      selectedOptions:[]
    })
  }

  showSharingList = () =>{
    var list = document.getElementById("select-sharing-list");
    list.style.opacity = "1";
  }

  hideSharingList = () =>{
    var list = document.getElementById("select-sharing-list");
    list.style.opacity = "0";
  }

  getFile = (event) =>{
    this.setState({file: event.currentTarget.files[0]})
  }

  render() {
    const {selectedOptions} = this.state.selectedOptions;

    return (
      <AppBar className="cs142-topbar-appBar">
        <Toolbar>
          <Typography id = "author">
              Ziyue Xiao
          </Typography>

          <Typography id = "user">
            {this.props.content }
          </Typography>
          
          <div>
            <Typography id = "logged-user">
              {"Hi " + this.props.loginUser}
            </Typography>
          </div>

          <dialog id ="uploadDialog">
            <div id = "add-new-hint">
              Upload new photos: 
            </div>
            <input id = "choose-file-area" type="file" accept="image/*"  onChange = {this.getFile}  ref={(domFileRef) => { this.uploadInput = domFileRef; }} />
            <div id = "sharing-method">
              <div  className ="sharing-button">
                <label>
                  <input type = "radio" name ="share" id= "public" onClick = {this.hideSharingList}/>
                  public
               </label >
              </div>
              <div className ="sharing-button">
                <label>
                  <input type = "radio" name ="share" id= "private" onClick = {this.hideSharingList}/>
                  private
                </label>
              </div>
              <div className ="sharing-button" id = "friends-div">
                <label id = "parent">
                  <input type = "radio" name ="share" id= "friends" onClick = {this.showSharingList}/>
                  friends
                </label>
              </div>
            </div>
            <Select isMulti options={this.props.sharingList} onChange = {this.handleChange} value = {selectedOptions}
                    id = "select-sharing-list" placeholder = "Select sharing list"> </Select>
            <button id = "close-upload-button" onClick = {this.closeUploadDialog}>
              cancel
            </button> 
            <button id = "upload-butt" onClick = {this.uploadPhoto}>
              upload
            </button> 
          </dialog>


          <div className = "dropdown">
            <button className = "dropbtn" >
              <MenuIcon />
            </button>
            <div className = "dropdown-content">
              <button  onClick = {this.openUploadDialog}>
                <Typography>
                  Upload
                </Typography>
              </button>
              <button onClick = {this.props.logoutButt}>
                <Typography>
                  Log out
                </Typography>
              </button>
              <button onClick = {this.deleteUser}>
                <Typography>
                  Delete
                </Typography>
              </button>
            </div>
          </div>
        </Toolbar>
      </AppBar>
    );
  }
}

export default TopBar;
