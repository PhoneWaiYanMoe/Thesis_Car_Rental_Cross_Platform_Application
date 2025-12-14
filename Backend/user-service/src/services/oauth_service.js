const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

class OAuthService {
  
  async findOrCreateOAuthUser(oauthData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { provider, providerId, email, fullName, avatarUrl, accessToken, refreshToken } = oauthData;
      
      console.log(`OAuth login attempt: ${provider} - ${email}`);
      
      // Check if OAuth account already exists
      const oauthResult = await client.query(
        'SELECT user_id FROM oauth_accounts WHERE provider = $1 AND provider_user_id = $2',
        [provider, providerId]
      );
      
      let userId;
      
      if (oauthResult.rows.length > 0) {
        // OAuth account exists - return existing user
        userId = oauthResult.rows[0].user_id;
        console.log(`Existing OAuth account found for user: ${userId}`);
        
        // Update tokens (keep OAuth tokens fresh)
        await client.query(
          `UPDATE oauth_accounts 
           SET access_token = $1, 
               refresh_token = $2, 
               token_expires_at = NOW() + INTERVAL '60 days',
               updated_at = NOW()
           WHERE provider = $3 AND provider_user_id = $4`,
          [accessToken, refreshToken, provider, providerId]
        );
        
      } else {
        // Check if user exists by email
        const userResult = await client.query(
          'SELECT user_id, is_verified FROM users WHERE email = $1',
          [email]
        );
        
        if (userResult.rows.length > 0) {
          // User exists - link OAuth account
          userId = userResult.rows[0].user_id;
          console.log(`Linking ${provider} to existing user: ${userId}`);
          
          // Auto-verify user if not already verified (social accounts are trusted)
          if (!userResult.rows[0].is_verified) {
            await client.query(
              'UPDATE users SET is_verified = true, updated_at = NOW() WHERE user_id = $1',
              [userId]
            );
          }
          
        } else {
          // Create new user
          userId = uuidv4();
          console.log(`Creating new user from ${provider}: ${email}`);
          
          await client.query(
            `INSERT INTO users (
              user_id, email, full_name, avatar_url, 
              role, is_verified, password_hash
            ) VALUES ($1, $2, $3, $4, 'customer', true, NULL)`,
            [userId, email, fullName, avatarUrl]
          );
        }
        
        // Create OAuth account link
        await client.query(
          `INSERT INTO oauth_accounts (
            user_id, provider, provider_user_id, 
            access_token, refresh_token, token_expires_at,
            profile_data
          ) VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '60 days', $6)`,
          [
            userId, 
            provider, 
            providerId, 
            accessToken, 
            refreshToken,
            JSON.stringify({ fullName, avatarUrl, email })
          ]
        );
        
        console.log(`OAuth account created/linked for user: ${userId}`);
      }
      
      // Get complete user data
      const userDataResult = await client.query(
        `SELECT user_id, email, full_name, phone, role, avatar_url, is_verified, created_at 
         FROM users WHERE user_id = $1`,
        [userId]
      );
      
      await client.query('COMMIT');
      
      console.log(`OAuth login successful for: ${email}`);
      return userDataResult.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('OAuth service error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Link OAuth account to an already logged-in user
   * Used when user is in their account settings and wants to connect social media
   */
  async linkOAuthAccount(userId, oauthData) {
    const client = await pool.connect();
    
    try {
      const { provider, providerId, accessToken, refreshToken, email, fullName, avatarUrl } = oauthData;
      
      console.log(`Linking ${provider} account to user: ${userId}`);
      
      // Check if this OAuth account is already linked to another user
      const existingLink = await client.query(
        'SELECT user_id FROM oauth_accounts WHERE provider = $1 AND provider_user_id = $2',
        [provider, providerId]
      );
      
      if (existingLink.rows.length > 0) {
        if (existingLink.rows[0].user_id !== userId) {
          throw new Error(`This ${provider} account is already linked to another user`);
        }
        // Already linked to this user
        console.log(`${provider} already linked to user ${userId}`);
        return { 
          success: true, 
          message: `${provider} account is already linked`,
          alreadyLinked: true 
        };
      }
      
      // Insert OAuth link
      await client.query(
        `INSERT INTO oauth_accounts (
          user_id, provider, provider_user_id, 
          access_token, refresh_token, token_expires_at,
          profile_data
        ) VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '60 days', $6)`,
        [
          userId, 
          provider, 
          providerId, 
          accessToken, 
          refreshToken,
          JSON.stringify({ fullName, avatarUrl, email })
        ]
      );
      
      console.log(`Successfully linked ${provider} to user ${userId}`);
      
      return { 
        success: true, 
        message: `${provider} account linked successfully`,
        alreadyLinked: false
      };
      
    } catch (error) {
      console.error('Link OAuth account error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Check which OAuth providers are linked to a user
   */
  async getLinkedProviders(userId) {
    try {
      const result = await pool.query(
        'SELECT provider, created_at FROM oauth_accounts WHERE user_id = $1',
        [userId]
      );
      
      return result.rows.map(row => ({
        provider: row.provider,
        linkedAt: row.created_at
      }));
    } catch (error) {
      console.error('Get linked providers error:', error);
      throw error;
    }
  }
  

    // Unlink OAuth provider from user account
  async unlinkOAuthAccount(userId, provider) {
    const client = await pool.connect();
    
    try {
      // Check if user has password (can't unlink if no password and only one OAuth)
      const userResult = await pool.query(
        'SELECT password_hash FROM users WHERE user_id = $1',
        [userId]
      );
      
      const hasPassword = userResult.rows[0]?.password_hash !== null;
      
      // Count linked OAuth accounts
      const oauthCount = await pool.query(
        'SELECT COUNT(*) FROM oauth_accounts WHERE user_id = $1',
        [userId]
      );
      
      const linkedAccounts = parseInt(oauthCount.rows[0].count);
      
      // Don't allow unlinking if it's the only login method
      if (!hasPassword && linkedAccounts <= 1) {
        throw new Error('Cannot unlink the only login method. Please set a password first.');
      }
      
      // Delete OAuth link
      const result = await client.query(
        'DELETE FROM oauth_accounts WHERE user_id = $1 AND provider = $2 RETURNING provider',
        [userId, provider]
      );
      
      if (result.rows.length === 0) {
        throw new Error(`${provider} account is not linked`);
      }
      
      console.log(`Unlinked ${provider} from user ${userId}`);
      
      return { 
        success: true, 
        message: `${provider} account unlinked successfully` 
      };
      
    } catch (error) {
      console.error('Unlink OAuth account error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Generate JWT tokens for OAuth-authenticated user
   */
  generateTokens(user) {
    const accessToken = jwt.sign(
      { 
        userId: user.user_id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.user_id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );
    
    return { accessToken, refreshToken };
  }
}

module.exports = new OAuthService();