export const PROFILE_PHOTO_CHANGED_EVENT = "homeocentrum:profile-photo-changed";
export const PROFILE_IDENTITY_CHANGED_EVENT = "homeocentrum:profile-identity-changed";

export const notifyProfilePhotoChanged = () => {
  window.dispatchEvent(new Event(PROFILE_PHOTO_CHANGED_EVENT));
};

export const notifyProfileIdentityChanged = () => {
  window.dispatchEvent(new Event(PROFILE_IDENTITY_CHANGED_EVENT));
};
