import { useEffect, useRef, useState } from "react";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { clearPendingProgress, createProgressQueue, mergeProgress } from "../utils/progressQueue.js";

const browserStorage = () => { try { return window.localStorage; } catch { return null; } };

export default function useProgressSync({ uid, enabled, profile, setProfile, currentUid }) {
  const queueRef = useRef(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const [status, setStatus] = useState(null);
  useEffect(() => {
    if (!uid) { setStatus(null); return; }
    const queue = createProgressQueue({uid, storage:browserStorage(), write:async (owner, progress) => {
      // An old queued callback must not start an authenticated request after a
      // synchronous account change, before React has run effect cleanup.
      if (currentUid.current !== owner || !enabledRef.current) throw new Error("Progress owner is not ready");
      const updates = {};
      for (const field of ["completedLessons", "badges"]) {
        if (progress[field].length) updates[field] = arrayUnion(...progress[field]);
      }
      await updateDoc(doc(db, "users", owner), updates);
    }});
    queueRef.current = queue;
    const update = next => {
      if (currentUid.current !== uid) return;
      setStatus(next);
      if (next.pending && enabledRef.current) setProfile(profile =>
        profile && currentUid.current === uid && enabledRef.current
          ? {...profile, ...mergeProgress(profile, next.progress)} : profile);
    };
    const unsubscribe = queue.subscribe(update);
    update(queue.snapshot());
    const online = () => { if (currentUid.current === uid && enabledRef.current) queue.refresh(); };
    const storageChanged = event => {
      if (event.key === null || event.key?.startsWith(`everwise.progress.pending.v1:${encodeURIComponent(uid)}:`)) online();
    };
    window.addEventListener("online", online);
    window.addEventListener("storage", storageChanged);
    return () => {
      unsubscribe(); queue.dispose();
      if (queueRef.current === queue) queueRef.current = null;
      window.removeEventListener("online", online);
      window.removeEventListener("storage", storageChanged);
    };
  }, [uid, setProfile, currentUid]);
  useEffect(() => {
    if (enabled && currentUid.current === uid) queueRef.current?.refresh();
  }, [uid, enabled, currentUid]);
  // An auth/profile refresh can replace the profile in one batched render
  // without changing `enabled`. Reapply still-pending work in that case too.
  useEffect(() => {
    if (!enabled || !profile || currentUid.current !== uid) return;
    const pending = queueRef.current?.snapshot();
    if (!pending?.pending || !["completedLessons", "badges"].some(field =>
      pending.progress[field].some(value => !(profile[field] ?? []).includes(value)))) return;
    setProfile(current => current && currentUid.current === uid
      ? {...current, ...mergeProgress(current, pending.progress)} : current);
  }, [uid, enabled, profile, setProfile, currentUid]);

  return {
    status: enabled && currentUid.current === uid && status?.uid === uid ? status : null,
    record(progress) {
      if (enabled && uid && currentUid.current === uid && queueRef.current?.snapshot().uid === uid) queueRef.current.enqueue(progress);
    },
    retry() { if (currentUid.current === uid && queueRef.current?.snapshot().uid === uid) void queueRef.current.flush(); },
    clear() {
      if (queueRef.current?.snapshot().uid === uid) { queueRef.current.clear(); queueRef.current = null; }
      clearPendingProgress(uid, browserStorage());
      if (currentUid.current === uid) setStatus(null);
    },
  };
}
