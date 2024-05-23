# Backend for youtube project

Our primary focus for this project is backend development.

Model link which help you to understand the structure 

- [Model link](https://app.eraser.io/workspace/fm0CfnimVsURVO43QpMg)


## Users
Table Name: users

Description: Stores user-related information and manages user authentication.

Key Fields:

- id (Primary Key): Unique identifier for the user.
- watchHistory: List of videos watched by the user.
- username: User's username.
- email: User's email address.
- fullName: User's full name.
- avatar: URL of the user's avatar.
- coverImage: URL of the user's cover image.
- password: User's password.
- refreshToken: Token used for session refresh.
- createdAt: Timestamp when the user was created.
- updatedAt: Timestamp when the user was last updated.

## Videos
Table Name: videos

Description: Contains details about the videos uploaded to the platform.

Key Fields:

- id (Primary Key): Unique identifier for the video.
- videoFile: URL of the video file.
- thumbnail: URL of the video thumbnail.
- owner: User who uploaded the video.
- title: Title of the video.
- description: Description of the video.
- duration: Duration of the video in seconds.
- views: Number of views the video has received.
- isPublished: Indicates whether the video is published.
- createdAt: Timestamp when the video was created.
- updatedAt: Timestamp when the video was last updated.

## Playlists
Table Name: playlists

Description: Represents user-created collections of videos.

Key Fields:

- id (Primary Key): Unique identifier for the playlist.
- name: Name of the playlist.
- description: Description of the playlist.
- createdAt: Timestamp when the playlist was created.
- updatedAt: Timestamp when the playlist was last updated.
- videos: List of videos in the playlist.
- owner: User who created the playlist.

## Comments
Table Name: comments

Description: Stores comments made by users on videos.

Key Fields:

- id (Primary Key): Unique identifier for the comment.
- content: Content of the comment.
- createdAt: Timestamp when the comment was created.
- updatedAt: Timestamp when the comment was last updated.
- video: Video to which the comment belongs.
- owner: User who made the comment.

## Likes
Table Name: likes

Description: Tracks likes on comments, videos, and tweets.

Key Fields:

- id (Primary Key): Unique identifier for the like.
- comment: Comment that was liked.
- createdAt: Timestamp when the like was created.
- updatedAt: Timestamp when the like was last updated.
- video: Video that was liked.
- tweet: Tweet that was liked.
- likedBy: User who liked the content.

## Tweets
Table Name: tweets

Description: Manages short messages posted by users.

Key Fields:

- id (Primary Key): Unique identifier for the tweet.
- owner: User who posted the tweet.
- content: Content of the tweet.
- createdAt: Timestamp when the tweet was created.
- updatedAt: Timestamp when the tweet was last updated.

## Subscriptions
Table Name: subscriptions

Description: Manages user subscriptions to other users' channels.

Key Fields:

- id (Primary Key): Unique identifier for the subscription.
- subscriber: User who subscribes to the channel.
- channel: User's channel being subscribed to.
- createdAt: Timestamp when the subscription was created.
- updatedAt: Timestamp when the subscription was last updated.