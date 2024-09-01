import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { catchError, map, shareReplay, tap } from "rxjs/operators";

import { Course, sortCoursesBySeqNo } from "../model/course";
import { HttpClient } from "@angular/common/http";
import { LoadingService } from "../loading/loading.service";
import { MessagesService } from "../messages/messages.service";

@Injectable({
  providedIn: "root",
})
export class CoursesStore {
  private coursesSubject = new BehaviorSubject<Course[]>([]);
  courses$: Observable<Course[]> = this.coursesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private loading: LoadingService,
    private messages: MessagesService
  ) {
    this.loadAllCourses();
  }

  private loadAllCourses() {
    const loadCourses$ = this.http.get<Course[]>("/api/courses").pipe(
      map((res) => res["payload"]),
      catchError((error) => {
        const message = "Could not load courses";
        this.messages.showErrors(message);
        console.log(message, error);
        return throwError(error);
      }),
      tap((courses) => this.coursesSubject.next(courses))
    );

    this.loading.showLoaderUntilCompleted(loadCourses$).subscribe();
  }

  saveCourse(courseId: string, changes: Partial<Course>): Observable<any> {
    const courses = this.coursesSubject.getValue();

    const index = courses.findIndex((course) => course.id === courseId);
    const newCourse: Course = {
      ...courses[index],
      ...changes,
    };

    const newCourses: Course[] = courses.slice(0);
    newCourses[index] = newCourse;

    this.coursesSubject.next(newCourses);

    return this.http.put<any>(`/api/courses/${courseId}`, changes).pipe(
      catchError((error) => {
        const message = "Could not save course";
        this.messages.showErrors(message);
        console.log(message, error);
        return throwError(error);
      }),
      shareReplay()
    );
  }

  filterByCategory(category: string): Observable<Course[]> {
    return this.courses$.pipe(
      map((courses) =>
        courses
          .filter((course) => course.category === category)
          .sort(sortCoursesBySeqNo)
      )
    );
  }
}
