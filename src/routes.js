import Home from './pages/Home';
import Login from './pages/Login';
import About from './pages/About';
import Posts from './pages/Posts';
import Post from './pages/Post';
import Member from './pages/Member';
import Event from './pages/Event';
import News from './pages/News';
import NewPost from './pages/NewPost';
import Exchange from './pages/Exchange';
import Exchanges from './pages/Exchanges';
import Members from './pages/Members';
import Message from './pages/Message';


export default [
    {
        path: '/home',
        component: Home
    },
    {
        path: '/login',
        component: Login
    },
    {
        path: '/about',
        component: About
    },
    {
        path: '/offers',
        component: Posts
    },
    {
        path: '/requests',
        component: Posts
    },
    {
        path: '/posts',
        component: Posts
    },
    {
        path: '/post',
        component: NewPost
    },
    {
        path: '/post/:post_id',
        component: Post
    },
    {
        path: '/post/:post_id/edit',
        component: NewPost
    },
    {
        path: '/members',
        component: Members
    },
    {
        path: '/members/exchange',
        component: Members
    },
    {
        path: '/member/:user_id', // where user_id can be me for currently logged in user
        component: Member
    },
    {
        path: '/member/:user_id/message',
        component: Message
    },
    {
        path: '/feedback',
        component: Message
    },
    {
        path: '/event/:event_id',
        component: Event
    },
    {
        path: '/news/:story_id',
        component: News
    },
    {
        path: '/exchanges',
        component: Exchanges
    },
    {
        path: '/exchanges/new',
        component: Exchange
    }


];
