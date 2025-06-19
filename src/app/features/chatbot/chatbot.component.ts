import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../core/services/chat/chat.service';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

@Component({
  standalone: true,
  selector: 'app-chatbot',
  imports: [CommonModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css'],
})
export class ChatbotComponent implements OnInit {
  isOpen = false;
  suggestions: string[] = [];
  messages: Message[] = [];

  constructor(private chat: ChatService) { }

  ngOnInit() {
    // load only the questions you have answers for
    this.chat.getSuggestions().subscribe(list => {
      this.suggestions = list;
      // seed with a welcome
      this.messages = [{ sender: 'bot', text: '🤖 Hi! Tap a question above to get started.' }];
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  /** user tapped one of the preset questions */
  askSuggestion(question: string) {
    // show it
    this.messages.push({ sender: 'user', text: question });

    // fetch answer
    this.chat.send(question).subscribe({
      next: ({ answer }) => {
        this.messages.push({ sender: 'bot', text: answer });
      },
      error: () => {
        this.messages.push({
          sender: 'bot',
          text: '🚨 Sorry, something went wrong. Please try again later.'
        });
      }
    });
  }
}
