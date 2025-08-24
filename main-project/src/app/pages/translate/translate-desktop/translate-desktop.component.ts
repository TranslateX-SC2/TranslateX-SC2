export interface TranscriptItem {
  text: string;
}

import {Component, inject, OnInit} from '@angular/core';
import {Store} from '@ngxs/store';
import {HttpClient} from '@angular/common/http';
import {takeUntil, tap} from 'rxjs/operators';
import {BaseComponent} from '../../../components/base/base.component';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonInput,
  IonModal,
  IonSpinner
} from '@ionic/angular/standalone';
import {TranslateInputButtonComponent} from '../input/button/button.component';
import {LanguageSelectorsComponent} from '../language-selectors/language-selectors.component';
import {SendFeedbackComponent} from '../send-feedback/send-feedback.component';
import {TranslocoPipe} from '@jsverse/transloco';
import {SpokenToSignedComponent} from '../spoken-to-signed/spoken-to-signed.component';
import {SignedToSpokenComponent} from '../signed-to-spoken/signed-to-spoken.component';
import {DropPoseFileComponent} from '../drop-pose-file/drop-pose-file.component';
import {addIcons} from 'ionicons';
import {cloudUpload, language, videocam} from 'ionicons/icons';
import {RouterLink} from '@angular/router';
import {LogoComponent} from '../../../components/logo/logo.component';
import {FormsModule} from '@angular/forms';

// ✅ Import action
import {SetSpokenLanguageText} from '../../../modules/translate/translate.actions';

@Component({
  selector: 'app-translate-desktop',
  templateUrl: './translate-desktop.component.html',
  styleUrls: ['./translate-desktop.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonContent,
    IonTitle,
    TranslateInputButtonComponent,
    IonInput,
    LanguageSelectorsComponent,
    SendFeedbackComponent,
    TranslocoPipe,
    SpokenToSignedComponent,
    SignedToSpokenComponent,
    DropPoseFileComponent,
    IonButton,
    IonModal,
    RouterLink,
    LogoComponent,
    FormsModule,
    IonSpinner
  ],
})
export class TranslateDesktopComponent extends BaseComponent implements OnInit {

  private store = inject(Store);
  private http = inject(HttpClient);

  spokenToSigned$ = this.store.select<boolean>(state => state.translate.spokenToSigned);
  showInputBox: boolean = false;
  spokenToSigned: boolean;
  inputText: string = '';

  // 🔹 Updated type
  transcriptList: TranscriptItem[] = [];

  // 🔹 Modal state
  isUploadModalOpen = false;
  videoUrl: string | null = null;

  constructor() {
    super();
    addIcons({language, videocam, cloudUpload});
  }

  ngOnInit(): void {
    this.spokenToSigned$
      .pipe(
        tap(spokenToSigned => (this.spokenToSigned = spokenToSigned)),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();
  }

  toggleInputBox() {
    this.showInputBox = !this.showInputBox;
  }

  toggleInputclose() {
    window.location.reload();
  }

  // 🔹 Upload Modal Logic
  openUploadModal() {
    this.isUploadModalOpen = true;
  }

  closeUploadModal() {
    this.isUploadModalOpen = false;
    this.videoUrl = null; 
    window.location.reload();
  }

  loading: boolean = false;


  // onFileSelected(event: Event) {
  //   const input = event.target as HTMLInputElement;
  //   if (input.files && input.files.length > 0) {
  //     const file = input.files[0];

  //     if (file.type === 'video/mp4' || file.type.startsWith('audio/')) {
  //       this.videoUrl = URL.createObjectURL(file);

  //       // Upload to FastAPI
  //       const formData = new FormData();
  //       formData.append('file', file);

  //       this.http.post<{ transcript: TranscriptItem[] }>('http://localhost:8000/transcribe', formData)
  //         .subscribe({
  //           next: (res) => {
  //             this.transcriptList = res.transcript;
  //             console.log('Transcript received:', this.transcriptList);
  //           },
  //           error: (err) => {
  //             console.error('Transcription failed:', err);
  //             alert(err.error?.detail || 'Transcription failed');
  //           }
  //         });

  //     } else {
  //       alert('Only MP4 or audio files are supported.');
  //     }
  //   }
  // }


//   onFileSelected(event: Event) {
//   const input = event.target as HTMLInputElement;
//   if (input.files && input.files.length > 0) {
//     const file = input.files[0];

//     if (file.type === 'video/mp4' || file.type.startsWith('audio/')) {
//       this.videoUrl = URL.createObjectURL(file);

//       // Enable loader
//       this.loading = true;

//       // Upload to FastAPI
//       const formData = new FormData();
//       formData.append('file', file);

//       this.http.post<{ transcript: TranscriptItem[] }>('http://localhost:8000/transcribe', formData)
//         .subscribe({
//           next: (res) => {
//             this.transcriptList = res.transcript;
//             console.log('Transcript received:', this.transcriptList);
//             this.loading = false; // ✅ stop loader
//           },
//           error: (err) => {
//             console.error('Transcription failed:', err);
//             alert(err.error?.detail || 'Transcription failed');
//             this.loading = false; // ✅ stop loader even on error
//           }
//         });

//     } else {
//       alert('Only MP4 or audio files are supported.');
//     }
//   }
// }


// onFileSelected(event: Event) {
//   const input = event.target as HTMLInputElement;
//   if (input.files && input.files.length > 0) {
//     const file = input.files[0];

//     if (file.type === 'video/mp4' || file.type.startsWith('audio/')) {
//       this.videoUrl = URL.createObjectURL(file);

//       // Enable loader
//       this.loading = true;

//       // Upload to FastAPI
//       const formData = new FormData();
//       formData.append('file', file);

//       this.http.post<{ transcript: TranscriptItem[] }>('http://localhost:8000/transcribe', formData)
//         .subscribe({
//           next: (res) => {
//             this.transcriptList = res.transcript;
//             console.log('Transcript received:', this.transcriptList);

//             if (Array.isArray(this.transcriptList)) {
//               this.transcriptList.forEach((item: TranscriptItem, index: number) => {
//                 const text = item.text ?? String(item);

//                 setTimeout(() => {
//                   console.log(`Dispatching transcript item ${index + 1}:`, text);
//                   this.store.dispatch(new SetSpokenLanguageText(text));
//                 }, index * 20000);
//               });
//             } else {
//               this.store.dispatch(new SetSpokenLanguageText(String(this.transcriptList)));
//             }

//             alert(`Transcript fetching started. Items will dispatch every 20s.`);

//             this.loading = false; // ✅ stop loader
//           },
//           error: (err) => {
//             console.error('Transcription failed:', err);
//             alert(err.error?.detail || 'Transcription failed');
//             this.loading = false; // ✅ stop loader even on error
//           }
//         });

//     } else {
//       alert('Only MP4 or audio files are supported.');
//     }
//   }
// }


onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];

    if (file.type === 'video/mp4' || file.type.startsWith('audio/')) {
      this.videoUrl = URL.createObjectURL(file);

      // Enable loader
      this.loading = true;

      // Upload to FastAPI
      const formData = new FormData();
      formData.append('file', file);

      this.http.post<{ transcript: TranscriptItem[] }>('http://localhost:8000/transcribe', formData)
        .subscribe({
          next: (res) => {
            this.transcriptList = res.transcript;
            console.log('Transcript received:', this.transcriptList);

            // ✅ Start video playback muted
            const videoElement = document.getElementById('uploadedVideo') as HTMLVideoElement;
            if (videoElement) {
              videoElement.muted = true;
              videoElement.play().catch(err => console.warn('Autoplay blocked:', err));
            }

            // ✅ Dispatch transcript items every 20s
            if (Array.isArray(this.transcriptList)) {
              this.transcriptList.forEach((item: TranscriptItem, index: number) => {
                const text = item.text ?? String(item);

                setTimeout(() => {
                  console.log(`Dispatching transcript item ${index + 1}:`, text);
                  this.store.dispatch(new SetSpokenLanguageText(text));
                }, index * 20000);
              });
            } else {
              this.store.dispatch(new SetSpokenLanguageText(String(this.transcriptList)));
            }

            alert(`Transcript fetching started. Items will dispatch every 20s.`);

            this.loading = false; // ✅ stop loader
          },
          error: (err) => {
            console.error('Transcription failed:', err);
            alert(err.error?.detail || 'Transcription failed');
            this.loading = false; // ✅ stop loader even on error
          }
        });

    } else {
      alert('Only MP4 or audio files are supported.');
    }
  }
}



  // 🔹 Transcript submission logic
  submited_action() {
    const url = 'http://127.0.0.1:8000/youtube_transcript/';
    const payload = { video: this.inputText };

    this.http.post<any>(url, payload).subscribe({
      next: response => {
        console.log('POST request successful:', response);

        this.transcriptList = response.transcript;

        if (Array.isArray(response.transcript)) {
          response.transcript.forEach((item: TranscriptItem, index: number) => {
            const text = item.text ?? String(item);

            setTimeout(() => {
              console.log(`Dispatching transcript item ${index + 1}:`, text);
              this.store.dispatch(new SetSpokenLanguageText(text));
            }, index * 20000);
          });
        } else {
          this.store.dispatch(new SetSpokenLanguageText(String(response.transcript)));
        }

        alert(`Transcript fetching started. Items will dispatch every 20s.`);
      },
      error: error => {
        console.error('Error in POST request:', error);
        alert('Failed to fetch the transcript.');
      },
    });
  }

  // 🔹 Dragging Logic
  dragging = false;
  startX = 0;
  startY = 0;
  offsetX = 0;
  offsetY = 0;

  startDrag(event: MouseEvent | TouchEvent) {
    this.dragging = true;
    this.startX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    this.startY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    document.addEventListener('mousemove', this.onDrag);
    document.addEventListener('mouseup', this.stopDrag);
    document.addEventListener('touchmove', this.onDrag);
    document.addEventListener('touchend', this.stopDrag);
  }

  onDrag = (event: MouseEvent | TouchEvent) => {
    if (!this.dragging) return;

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    const dx = clientX - this.startX;
    const dy = clientY - this.startY;

    this.offsetX += dx;
    this.offsetY += dy;

    const modalEl = document.querySelector('.video-window-modal') as HTMLElement;
    if (modalEl) {
      modalEl.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px)`;
    }

    this.startX = clientX;
    this.startY = clientY;
  };

  stopDrag = () => {
    this.dragging = false;
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);
    document.removeEventListener('touchmove', this.onDrag);
    document.removeEventListener('touchend', this.stopDrag);
  };
}
