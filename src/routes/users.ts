import { Router, Request, Response } from 'express';

export const usersRouter = Router();

// Mock database
const mockDatabase = {
  users: [
    { id: 1, name: 'Alice', email: 'alice@example.com', tags: 'developer,node' },
    { id: 2, name: 'Bob', email: 'bob@example.com', tags: 'manager,agile' }
  ]
};

// Email validation regex exactly as requested
const EMAIL_REGEX = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

usersRouter.post('/update-profile', (req: Request, res: Response) => {
  const { id, tags } = req.body;

  // Fetch the existing user object from the mock database
  const user = mockDatabase.users.find(u => u.id === (id || 1));
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Loop through comma-separated tags synchronously and validate emails
  if (tags && typeof tags === 'string') {
    const tagArray = tags.split(',');
    for (const tag of tagArray) {
      const trimmedTag = tag.trim();
      // Test regex if it looks like an email or we can just test all tags
      if (trimmedTag.includes('@')) {
        const isValid = EMAIL_REGEX.test(trimmedTag);
        if (!isValid) {
          return res.status(400).json({ error: `Invalid email in tags: ${trimmedTag}` });
        }
      }
    }
  }

  // Update the user by directly merging req.body into the existing user object
  Object.assign(user, req.body);

  // Return the updated user object with a 200 OK
  return res.status(200).json(user);
});
