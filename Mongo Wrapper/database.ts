import { Collection, CollectionInsertOneOptions, CommonOptions, Cursor, DeleteWriteOpResultObject, FilterQuery, FindOneOptions, InsertOneWriteOpResult, MongoCallback, MongoClient, ReplaceOneOptions, WithoutProjection } from "mongodb";

// sources:
//  https://leefreeman.xyz/2020/05/08/typescript-decorators/
//  https://blog.logrocket.com/a-practical-guide-to-typescript-decorators/
function logMethodTimestamps(target: any, name: string, descriptor: PropertyDescriptor): any {
    const method = descriptor.value;
    descriptor.value = async function (...args: any[]) {
        console.log(`calling method: ${name}`);
        const startTime = performance.now();
        const result = await method.apply(this, args);
        const endTime = performance.now();
        console.log(`${name} completed in ${endTime - startTime}ms`);
        return result;
    };
    return descriptor // TODO: is return necessary?
}

export class MongoConnection {
    private mongoUri: string;
    private collectionName: string;

    constructor(mongoUri: string, collectionName: string) {
        this.mongoUri = mongoUri;
        this.collectionName = collectionName
    }

    @logMethodTimestamps
    public async replaceOne(
        filter: FilterQuery<any>,
        doc: any,
        options?: ReplaceOneOptions | undefined
    ): Promise<void> {
        async function inner(collection: Collection, params: any[]): Promise<any> {
            const [filter, doc, options] = params
            return collection.replaceOne(filter, doc, options)
        }
        return this.connect(inner, [filter, doc, options])
    }

    @logMethodTimestamps
    public async deleteMany(
        filter: FilterQuery<any>,
        options?: CommonOptions,
        callback?: MongoCallback<DeleteWriteOpResultObject>
    ): Promise<void> {
        async function inner(collection: Collection, params: any[]): Promise<void> {
            const [filter, options, callback] = params
            return collection.deleteMany(filter, options, callback)
        }
        return this.connect(inner, [filter, options, callback])
    }

    @logMethodTimestamps
    public async findOne(
        filter: FilterQuery<any>,
        options?: WithoutProjection<FindOneOptions<any>> | undefined
    ): Promise<any> {
        async function inner(collection: Collection, params: any[]): Promise<Cursor<any>> {
            const [filter, options] = params as [FilterQuery<any>, WithoutProjection<FindOneOptions<any>> | undefined]
            return collection.findOne(filter, options)
        }
        return this.connect(inner, [filter, options])
    }

    @logMethodTimestamps
    public async find(
        query: FilterQuery<any>,
        options?: WithoutProjection<FindOneOptions<any>> | undefined
    ): Promise<any[]> {
        async function inner(collection: Collection, params: any[]): Promise<any[]> {
            const [filter, options] = params
            return collection.find(filter, options).toArray()
        }
        return this.connect(inner, [query, options])
    }

    @logMethodTimestamps
    public async insertOne(
        docs: any,
        options?: CollectionInsertOneOptions | undefined
    ): Promise<InsertOneWriteOpResult<any>> {
        async function inner(collection: Collection, params: any[]): Promise<InsertOneWriteOpResult<any>> {
            const [doc, options] = params as [any, CollectionInsertOneOptions | undefined]
            return collection.insertOne(doc, options)
        }
        return this.connect(inner, [docs, options])
    }

    @logMethodTimestamps
    public async deleteOne(
        filter: FilterQuery<any>,
        options?: (CommonOptions & {bypassDocumentValidation?: boolean | undefined;}) | undefined
    ): Promise<DeleteWriteOpResultObject> {
        async function inner(collection: Collection, params: any[]): Promise<DeleteWriteOpResultObject> {
            const [filter, options] = params as [FilterQuery<any>, (CommonOptions & {bypassDocumentValidation?: boolean | undefined;}) | undefined]
            return collection.deleteOne(filter, options)
        }
        return this.connect(inner, [filter, options])
    }

    private getCollection<MongoDBItem>(client: MongoClient, collectionName: string) {
        const db = client.db();
        return db.collection<MongoDBItem>(collectionName);
    }
    
    private async connect<Result>(
        func: (collection: Collection, params: any[]) => Promise<Result>,
        params: any[]
    ): Promise<Result> {
        let result;
        const client = new MongoClient(this.mongoUri, { useUnifiedTopology: true })
        try {
            await client.connect();
            const collection = this.getCollection(client, this.collectionName)
            result = await func(collection, params)
        } finally {
            await client.close();
        }
        return result;
    }
}