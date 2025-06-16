import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Category } from '../entities/Category';
import { AuthUtils } from '../utils/auth';

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // 初始化数据库连接
    await AppDataSource.initialize();
    console.log('Database connection established.');

    // 创建默认管理员用户
    const userRepository = AppDataSource.getRepository(User);
    const existingAdmin = await userRepository.findOne({
      where: { username: 'admin' }
    });

    if (!existingAdmin) {
      const hashedPassword = await AuthUtils.hashPassword('admin123456');
      const adminUser = userRepository.create({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        nickname: '管理员',
        bio: '网站管理员',
        role: 'admin',
        isActive: true
      });

      await userRepository.save(adminUser);
      console.log('Default admin user created:');
      console.log('Username: admin');
      console.log('Password: admin123456');
      console.log('Please change the password after first login!');
    } else {
      console.log('Admin user already exists.');
    }

    // 创建默认分类
    const categoryRepository = AppDataSource.getRepository(Category);
    const defaultCategories = [
      {
        name: '技术分享',
        description: '分享技术文章和编程经验',
        sortOrder: 1
      },
      {
        name: '生活随笔',
        description: '记录生活点滴和感悟',
        sortOrder: 2
      },
      {
        name: '学习笔记',
        description: '学习过程中的笔记和总结',
        sortOrder: 3
      }
    ];

    for (const categoryData of defaultCategories) {
      const existingCategory = await categoryRepository.findOne({
        where: { name: categoryData.name }
      });

      if (!existingCategory) {
        const category = categoryRepository.create(categoryData);
        await categoryRepository.save(category);
        console.log(`Created category: ${categoryData.name}`);
      }
    }

    console.log('Database initialization completed successfully!');
    
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Initialization script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Initialization script failed:', error);
      process.exit(1);
    });
}

export { initializeDatabase };