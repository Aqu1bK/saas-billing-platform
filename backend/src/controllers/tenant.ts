import { Request, Response } from 'express';
import { Pool } from 'pg';

export const createTenant = async (req: Request, res: Response) => {
  try {
    const { id, name } = req.body;
    
    if (!id || !name) {
      return res.status(400).json({ error: 'ID and name are required' });
    }
    
    // Use global pool to create tenant
    const client = await (req.app.get('globalPool') as Pool).connect();
    
    try {
      await client.query('BEGIN');
      
      // Call the create_tenant function
      await client.query(
        'SELECT create_tenant($1, $2)',
        [id, name]
      );
      
      await client.query('COMMIT');
      
      res.status(201).json({ 
        message: 'Tenant created successfully',
        tenant: { id, name }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
};