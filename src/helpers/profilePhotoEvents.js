export const PROFILE_PHOTO_CHANGED_EVENT = "homeocentrum:profile-photo-changed";

export const notifyProfilePhotoChanged = () => {
  window.dispatchEvent(new Event(PROFILE_PHOTO_CHANGED_EVENT));
};
