import { Component, OnInit } from "@angular/core";
import { Course, sortCoursesBySeqNo } from "../model/course";
import { interval, noop, Observable, of, throwError, timer } from "rxjs";
import {
  catchError,
  delay,
  delayWhen,
  filter,
  finalize,
  map,
  retryWhen,
  shareReplay,
  tap,
} from "rxjs/operators";
import { CoursesService } from "../services/courses.service";
import { LoadingService } from "../loading/loading.service";
import { MessagesService } from "../messages/messages.service";

@Component({
  selector: "home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent implements OnInit {
  beginnerCourses$: Observable<Course[]>;

  advancedCourses$: Observable<Course[]>;

  constructor(
    private coursesService: CoursesService,
    private loadingService: LoadingService,
    private messagesService: MessagesService
  ) {}

  ngOnInit() {
    this.reloadCourses();
  }

  reloadCourses(): void {
    const courses$ = this.coursesService.loadAllCourses().pipe(
      map((courses) => courses.sort(sortCoursesBySeqNo)),
      catchError((error) => {
        const message = "Could not load courses";
        this.messagesService.showErrors(message);
        console.log(message, error);
        return throwError(error);
      })
    );

    const loadCourses$ = this.loadingService.showLoaderUntilCompleted(courses$);

    this.beginnerCourses$ = loadCourses$.pipe(
      map((courses) =>
        courses.filter((course) => course.category === "BEGINNER")
      )
    );

    this.advancedCourses$ = loadCourses$.pipe(
      map((courses) =>
        courses.filter((course) => course.category === "ADVANCED")
      )
    );
  }
}
