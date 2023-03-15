import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

import { Injectable } from '@angular/core';
import { Sermon } from './models';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable()
export class SearchService {
  private url: string;
  constructor(private http: HttpClient) {
    this.url = 'https://preachingcollectivefunctions.azurewebsites.net';
  }

  public initialize() {}

  public searchForBook(
    book: string,
    chapter: string,
    source: string,
    author: string
  ): Observable<Sermon[]> {
    let params: HttpParams = new HttpParams();
    if (book) {
      params = params.append('book', book);
    }

    if (chapter) {
      params = params.append('chapter', chapter);
    }

    if (source) {
      params = params.append('source', source);
    }

    if (author) {
      params = params.append('author', author);
    }

    return this.http
      .get<Sermon[]>(`${this.url}/api/SermonsList`, {
        params: params,
      })
      .pipe(
        catchError((error) => {
          const errorMessage = `Search error`;
          console.error(`${errorMessage}: ${error}`);
          return throwError(errorMessage);
        })
      );
  }
}
