import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Subject } from 'rxjs/Subject';
import { Exercise } from "./exercise.model";
import { map } from "rxjs/operators";

@Injectable()
export class TrainingService {
    exerciseChanged = new Subject<Exercise>();
    exercisesChanged = new Subject<Exercise[]>();
    finishedExercisesChanged = new Subject<Exercise[]>();
    private availableExercises: Exercise[] = [];
    private runningExercise: Exercise;

    constructor(private db: AngularFirestore) {

    }

    fetchAvailableExercises() {
        this.db
            .collection("availableExercises")
            .snapshotChanges()
            .pipe(
                map((docArray) => {
                    return docArray.map((doc) => {
                        return {
                            id: doc.payload.doc.id,
                            ...(doc.payload.doc.data() as Exercise),
                        };
                    });
                })
            ).subscribe((exercises: Exercise[]) => {
                this.availableExercises = exercises;
                this.exercisesChanged.next([...this.availableExercises]);
            })
    }

    startExercise(selectedId: string) {
        this.runningExercise = this.availableExercises.find(ex => ex.id === selectedId);
        this.exerciseChanged.next({ ...this.runningExercise });
    }

    getRunningExercise() {
        return { ...this.runningExercise };
    }

    fetchCompletedOrCancelledExercise() {
        this.db.collection('finishedExercises').valueChanges().subscribe((exercises: Exercise[]) => {
            console.log(exercises, 'exercises in fetch');
            this.finishedExercisesChanged.next(exercises);
        });
    }

    completeExercise() {
        this.addDataToDatabase({ ...this.runningExercise, date: new Date(), state: 'completed' });
        this.runningExercise = null;
        this.exerciseChanged.next(null);
    }

    cancelExercise(progress: number) {
        this.addDataToDatabase({
            ...this.runningExercise,
            date: new Date(),
            duration: this.runningExercise.duration * (progress / 100),
            calories: this.runningExercise.calories * (progress / 100),
            state: 'cancelled'
        });

        this.runningExercise = null;
        this.exerciseChanged.next(null);
    }

    private addDataToDatabase(exercise: Exercise) {
        this.db.collection('finishedExercises').add(exercise);
    }
}