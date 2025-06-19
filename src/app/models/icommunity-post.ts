export interface IComment {
    id: number;
    post_id: number;
    user_id: number;
    message: string;
    created_at: string;
    name: string;
    image: string | null;
}



export interface ICommunityPost {
    id: number;
    title: string;
    content: string;
    snippet: string;
    image: string | null;
    author_id: number;
    created_at: string;
    author: string;
    author_image: string | null;
    authorAvatar?: string;
    comments: IComment[];
}