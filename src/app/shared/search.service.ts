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

  public searchForBook(book: string, chapter: string): Observable<Sermon[]> {
    let params: HttpParams = new HttpParams();
    params = params.append('book', book);

    if (chapter) {
      params = params.append('chapter', chapter);
    }

    return this.http
      .get<Sermon[]>(`${this.url}/api/SearchForSermon`, {
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
