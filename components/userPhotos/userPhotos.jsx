import React from 'react';
import {
  Typography, Grid, Card, CardHeader, CardActions, Button, Avatar, CardContent, TextField
} from '@material-ui/core';
import {Link} from "react-router-dom";
import './userPhotos.css';
import axios from 'axios';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import PhotoIcon from '@material-ui/icons/Photo';
import SendIcon from '@material-ui/icons/Send';


/**
 * Define UserPhotos, a React componment of CS142 project #5
 */
class UserPhotos extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showContent: "",
      refresh: true,
      loginUserId : this.props.loginUserId
    }
  }


  submitComment = (event) => {
    event.preventDefault();

    var id = event.currentTarget.id.slice(6);
    var commentContent = document.getElementById("commentContent" + id).value;
    document.getElementById("commentContent" + id).value = "";

    axios.post("/commentsOfPhoto/" + id, {
      comment : commentContent,
    })
    .then((response) => {
      console.log(response.data);
      this.setState({refresh: true})
    })
    .catch(function(err){
      alert(err.request.response);
    })
  }

  deletePhoto = (event) =>{
    event.preventDefault();
    var check = confirm("Delete this photo?");
    if (check == true){
      let joint = event.currentTarget.id.trim().split("-");
      let photoId = joint[0];
      let userId = joint[1];

      axios.post("/deletePhoto/" + photoId, {
        user_id : userId
      })
      .then((response) => {
        console.log(response.data);
        this.setState({refresh: true});
      })
      .catch((err) =>{
        alert(err.request.response);
      })
    }
  }

  deleteComment = (event) =>{
    event.preventDefault();
    var check = confirm("Delete this comment?");
    if (check){
      let joint = event.currentTarget.id.trim().split("-");
      let photoId = joint[0];
      let commentId = joint[1];
      let userId = joint[2];
      axios.post("/deleteComment/"+ photoId, {
        _id : commentId,
        user_id : userId
      })
      .then((response) =>{
        console.log(response.data);
        this.setState({refresh: true});
      })
      .catch((err) =>{
        alert(err.request.response);
      })
    }
  }

  likePhoto = (event) =>{
    event.preventDefault();
    var likeButton = document.getElementById(event.target.id);
    var count;

    //like the photos
    if (likeButton.style.color !== "red"){
      likeButton.style.color = "red";
      count = 1;
    }else{ //unlike the photo
      likeButton.style.color = "gray";
      count = -1;
    }

    axios.post("/likePhoto", {
      photo_id : event.target.id.slice(4),
      count : count
    })
    .then((response) =>{
      console.log(response.data);
      this.setState({
        refresh:true,
      });
    })
    .catch((err) =>{
      console.log(err);
    })
  }

    
  componentDidUpdate = () =>{
    if (this.state.refresh){
    var userId = this.props.match.params.userId;
    axios.get("/photosOfUser/" + userId)
    .then((response) => {
      var photos = response.data;
      var display = [];

      for (var i = 0; i < photos.length; i++){
        let photo = photos[i];
        let photoId = photo._id;
        let date = photo.date_time;
        let file = photo.image_data;
        let comments = photo.comments;


        display[i] = 
            <Card className = "each-photo">
              {
                (this.state.loginUserId === photo.user_id) ?
                <CardHeader title = "Picture uploaded on" subheader = {date} avatar = {<PhotoIcon />}
                action = {<Button id = {photoId + "-" + photo.user_id} onClick = {event => {this.deletePhoto(event)}}><HighlightOffIcon /></Button>}/>
              :
                <CardHeader title = "Picture uploaded on" subheader = {date} avatar = {<PhotoIcon />} />
              }

              <img className = "each-pic" src = {file} alt = {photoId} />
              <CardActions>
                {
                (photo.likes.includes(this.state.loginUserId))?
                  <span  className ="like-button"  id = {"like" + photoId} onClick = {this.likePhoto} style = {{color : "red" }}>
                   &#10084;
                  </span>
                : 
                  <span  className ="like-button" id = {"like" + photoId} onClick = {this.likePhoto} style = {{color : "gray" }}>
                  &#10084;
                  </span>
                }
                <Typography>
                  {photo.likes.length} people liked this photo
                </Typography>
              </CardActions>
              {
                comments ? 
                  comments.map((comment) => 
                    <Card elevation = {0} >
                      {
                        (this.state.loginUserId == comment.user._id) ?
                        <CardHeader className = "what" title = {"@ " + comment.user.first_name + " " + comment.user.last_name + " comment on"}
                          subheader = {comment.date_time} 
                          avatar = {<Link className = "avatar-link" to = {`/users/${comment.user._id}`} onClick = {this.props.handler}><Avatar >{comment.user.first_name.charAt(0)}</Avatar></Link>} 
                          action ={<Button  id = {photoId+ "-" + comment._id + "-"+comment.user._id} onClick = {event =>{this.deleteComment(event)}}><HighlightOffIcon /></Button>}/>
                      :
                        <CardHeader className = "what" title = {"@ " + comment.user.first_name + " " + comment.user.last_name + " comment on"}
                          subheader = {comment.date_time} 
                          avatar = {<Link className = "avatar-link" to = {`/users/${comment.user._id}`} onClick = {this.props.handler}><Avatar >{comment.user.first_name.charAt(0)}</Avatar></Link>} />
                      }
                      <div className = "comment-content">
                        <Typography>
                          {comment.comment}
                        </Typography>
                      </div>
                    </Card>
                  )
              : 
                <div></div>
              }
              <div className = "add-new-area">
                <Avatar className = "add-new-avatar">
                  +
                </Avatar>
                <TextField id = {"commentContent" + photoId} className = "add-new-textfield" label = "Add a new comment"/>
                <button className = "add-new-button" id = {"button" + photoId} onClick = {this.submitComment}>
                  <SendIcon />
                </button>
              </div>
            </Card>     
    ;} 
      this.setState ({
        showContent: display,
        refresh: false
      });
    })
    .catch(function (err){
      console.log(err);
    })
    }
    
  }

  render() {
    return (
        <div>
          {this.state.showContent}
        </div>
    );
  }
}

export default UserPhotos;
