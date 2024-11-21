export async function checkFriendStatus(currentUser, friendUser) {
  const isPending = currentUser.friends.some(
    (friend) =>
      friend.userId.equals(friendUser._id) && friend.status === 'pending'
  );
  const isPending_2 = friendUser.friends.some(
    (friend) =>
      friend.userId.equals(currentUser._id) && friend.status === 'pending'
  );

  const isAccepted = currentUser.friends.some(
    (friend) =>
      friend.userId.equals(friendUser._id) && friend.status === 'accepted'
  );

  return { isPending, isAccepted, isPending_2 };
}

export function generateRoomCode(userId, username) {
  return `${userId.slice(-7)}-${username}`;
}

// Separate email template creation
export function createFriendRequestEmailTemplate({ currentUser, friendUsername, uniqueCode }) {
    return `
    <h2>New Friend Request</h2>
    <p>Hello! You have received a friend request from <b>${currentUser}</b> on ioChatApp.</p>
    <p>If you recognize this user and want to accept their request, please use this unique code:</p>
    <h3>${uniqueCode}</h3>
    <p>To accept the request:</p>
    <ol>
        <li>Open ioChatApp</li>
        <li>Go to "Add friends"</li>
        <li>Enter the username <b>${currentUser}</b></li>
        <li>Enter this unique code</li>
    </ol>
    <p>If you don't recognize this user, you can safely ignore this email.</p>`;
}
