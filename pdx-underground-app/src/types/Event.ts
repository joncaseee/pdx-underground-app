export interface Event {
    id: string;
    title: string;
    organizer: string;
    description: string;
    dateTime: string;
    imageUrl: string;
    userId: string;
    likes: number;
    likedBy: string[];
  }