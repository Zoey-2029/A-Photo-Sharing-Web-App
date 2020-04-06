import React from 'react';
import {
  Card, Typography, CardHeader, CardActions, Avatar, IconButton
} from '@material-ui/core';
import {Link} from "react-router-dom";
import './userDetail.css';
import axios from 'axios';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import AssignmentIndRoundedIcon from '@material-ui/icons/AssignmentIndRounded';
import DescriptionRoundedIcon from '@material-ui/icons/DescriptionRounded';
import DoubleArrowRoundedIcon from '@material-ui/icons/DoubleArrowRounded';
import MessageIcon from '@material-ui/icons/Message';
import HistoryIcon from '@material-ui/icons/History';
import WhatshotIcon from '@material-ui/icons/Whatshot';



/**
 * Define UserDetail, a React componment of CS142 project #5
 */
class UserDetail extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      name: " ",
      location: " ",
      description: " ",
      occupation: " ",
      id: " ",
      path: " ",
      useageUpdate:false,
      recentUploadedPhoto: null,
      mostCommentedPhoto : null
    };
  }

  componentDidMount = () =>{
    var userPath = this.props.match.path;
    var userId = userPath.slice(7);
    var path = "/photos/" + userId;
    var getModel = "/user/" + userId;

    axios.get(getModel)
    .then((response) => {
      var user = response.data;

      this.setState({
        name: user.first_name + " " + user.last_name,
        location: user.location,
        description: user.description, 
        occupation: user.occupation,
        id: user._id,
        path: path
      });
    })
    .catch(function (err){
      console.log(err);
    })
  }

  componentDidUpdate = () =>{
    var userPath = this.props.match.path;
    var userId = userPath.slice(7);

    axios.get("/updateUserUseage/" + userId)
    .then((response) =>{
      if (! this.state.recentUploadedPhoto){
        console.log("update useage of current user!");

        this.setState({
          recentUploadedPhoto: response.data.recentUploadedPhoto,
          mostCommentedPhoto: response.data.mostCommentedPhoto
        })
      }


      if (response.data.recentUploadedPhoto.date_time !== this.state.recentUploadedPhoto.date_time
        || response.data.mostCommentedPhoto.date_time !== this.state.mostCommentedPhoto.date_time
        || response.date.mostCommentedPhoto.data.comments !== this.state.mostCommentedPhoto.comments){
          console.log("update useage of current user!");
          this.setState({
            recentUploadedPhoto: response.data.recentUploadedPhoto,
            mostCommentedPhoto: response.data.mostCommentedPhoto
          })
        }

    })
    .catch((err)=>{
      console.log(err);
    })
  }

  goToPhotos = () =>{
    window.location.replace("photo-share.html#/photos/" + this.state.id);
    this.props.handler();
  }

  render() {
    return (
    <div>
      <Card className = "detail-card">
        <CardHeader title = {this.state.name} avatar = {<Avatar>{this.state.name.charAt(0)}</Avatar>}
        action = {<Link to = {this.state.path} onClick = {this.props.clickToShowPics}><IconButton>
          <DoubleArrowRoundedIcon /></IconButton></Link>}/>
        <CardActions className = "location-occupation-description">
          <LocationOnIcon />
          <Typography>
            {this.state.location}
          </Typography>
        </CardActions >
        <CardActions className = "location-occupation-description">
        <AssignmentIndRoundedIcon />
          <Typography>
            {this.state.occupation}
          </Typography>
        </CardActions>
        <CardActions className = "location-occupation-description">
          <DescriptionRoundedIcon />
          <Typography>
            {this.state.description}
          </Typography>
        </CardActions>
      </Card>
      <div className = "display-cards">
      {
      (this.state.recentUploadedPhoto)?
        <Card className = "display-card">
          <CardHeader title = "Most commented photo" avatar = {<WhatshotIcon />}
          subheader = {this.state.mostCommentedPhoto.date_time}/>
          <img className = "thumb-nail-image" onClick = {this.goToPhotos} 
           src={ this.state.mostCommentedPhoto.image_data} />
          <CardActions>
            <MessageIcon />
            <Typography>
              Commented by {this.state.mostCommentedPhoto.comments} people
            </Typography>
          </CardActions>
        </Card>
        :
        <div> </div>
      }
      {
        (this.state.recentUploadedPhoto) ?
        <Card className = "display-card">
          <CardHeader title = "Most recently uploaded photo" avatar = {<HistoryIcon />}
          subheader = {this.state.recentUploadedPhoto.date_time}/>
          <img className = "thumb-nail-image" onClick = {this.goToPhotos}
              src= {this.state.recentUploadedPhoto.image_data} />
        </Card>
        :
        <div></div>
      }
      </div>

      
    </div>
    );
  }
}

export default UserDetail;
