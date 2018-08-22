/**
 * Service for actions with account
 */

import * as firebase from "firebase";
import { authProvider } from "../achievementsApp/config";

export class AccountService {
  public static isAdmin = false;

  /**
   * This method converts external profile id (login) to required format
   * @param {String} profileType variant of external profile (e.g. CodeCombat)
   * @param {String} id external profile id (login)
   * @returns {String} converted profile
   */
  public static processProfile(profileType: string, id: string) {
    switch (profileType) {
      case "CodeCombat":
        return id
          .toLowerCase()
          .replace(/[ _]/g, "-")
          .replace(/[!@#$%^&*()]/g, "");
      default:
        return id;
    }
  }

  public signIn() {
    return firebase
      .auth()
      .signInWithPopup(authProvider)
      .then(ref => {
        if (!ref.user) {
          throw new Error("Missing user");
        }
        return firebase
          .database()
          .ref(`/users/${ref.user.uid}`)
          .once("value")
          .then(existing => existing.val() || {})
          .then(
            existing =>
              ref.user &&
              firebase
                .database()
                .ref(`/users/${ref.user.uid}`)
                // Get existing user name and update display name if it doesn't exists
                .update({
                  displayName: existing.displayName || ref.user.displayName,
                  photoURL: ref.user.photoURL
                })

            // Return user ref to continue processing
          )
          .then(() => ref);
      })
      .then(
        ref =>
          // Update some private fields (could be increased in future)
          ref.user &&
          firebase
            .database()
            .ref(`/usersPrivate/${ref.user.uid}`)
            .update({
              displayName: ref.user.displayName,
              email: ref.user.email
            })
      );
  }

  public checkEULAAgreement() {
    return firebase
      .database()
      .ref(`/users/${firebase.auth().currentUser!.uid}/acceptedEULA`)
      .once("value")
      .then(data => data.val());
  }

  public acceptEULA() {
    return firebase
      .database()
      .ref(`/users/${firebase.auth().currentUser!.uid}`)
      .update({ acceptedEULA: true });
  }

  public signOut() {
    return firebase.auth().signOut();
  }

  public checkAdminStatus(uid: string) {
    return firebase
      .database()
      .ref(`/admins/${uid}`)
      .once("value")
      .then(response => response.val());
  }

  /**
   *
   * @param {String} externalProfileId
   * @param {String} uid
   * @param {String} login
   */
  public addExternalProfile(
    externalProfileId: string,
    uid: string,
    login: string
  ) {
    return firebase
      .database()
      .ref(`/userAchievements/${uid}/${externalProfileId}`)
      .set({
        id: login,
        lastUpdate: 0,
        totalAchievements: 0,
        achievements: {}
      });
  }

  public watchProfileRefresh(uid: string, externalProfileId: string) {
    let skip = true;
    return new Promise(resolve =>
      firebase
        .database()
        .ref(`/userAchievements/${uid}/${externalProfileId}`)
        .on("value", data => {
          if (skip) {
            skip = false;
            return;
          }
          data = data!.val();
          firebase
            .database()
            .ref(`/userAchievements/${uid}/${externalProfileId}`)
            .off();
          resolve(data || {});
        })
    );
  }

  public refreshAchievements(
    externalProfileId: string,
    uid: string,
    login: string
  ) {
    return firebase
      .database()
      .ref("updateProfileQueue/tasks")
      .push({
        service: externalProfileId,
        serviceId: login,
        uid
      });
  }

  public removeExternalProfile(externalProfileId: string, uid: string) {
    return firebase
      .database()
      .ref(`/userAchievements/${uid}/${externalProfileId}`)
      .remove();
  }

  public updateDisplayName(uid: string, displayName: string) {
    return firebase
      .database()
      .ref(`/users/${uid}/displayName`)
      .set(displayName);
  }

  public fetchExternalProfiles() {
    // This should be in firebase, I guess
    return {
      CodeCombat: {
        url: "https://codecombat.com",
        id: "CodeCombat",
        name: "Code Combat",
        description: "learn to Code JavaScript by Playing a Game"
      }
      /* Unnecessary for now
      FreeCodeCamp: {
        url: "https://fetch-free-code-ca.mp",
        description:
          "<a href='https://www.freecodecamp.org'>Free Code Camp</a>, " +
          "Learn to code with free online courses, programming projects, " +
          "and interview preparation for developer jobs."
      },
      PivotalExpert: {
        url: "https://fetch-pivotal-expe.rt",
        description: "Some description"
      } */
    };
  }
}

/**
 * @type {AccountService}
 */
export const accountService = new AccountService();
